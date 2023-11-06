import Crawler from "crawler"
import { handleHref, log, transformEnds, transformProtocol, writeFile } from "./tools.js"
import { errorFileName, lowErrorFileName, lowSuccessFileName } from './type.js'
import checkStatus from "./checkStatus.js"
import TProxy from './proxy.js'

/**
*
* @author : 田源
* @date : 2023-05-05 14:36
* @description : 爬虫主函数
* @param origin `String` 域名前缀
* @param startHref `String` 爬虫开始的域名
* @param recordLowDomain `Boolean` 是否记录低级域名，默认 false, 不建议关闭
* @param blockPathname `Array` 禁止爬取的链接数组 示例：`['/a', '/b']`
* @param saveDataFolderName `String` 自定义保存数据的文件夹，建议填一个，默认 `/data`
* @param callback `Function` 使用队列模式时的回调函数
* @param customFun `Function` 自定义处理函数，($, currentHref, folderName)=>{}
* @param onlyPage `Boolean` 是否只抓取当前页面，默认false, 可阻止全站爬取以及断点续传时继续加入队列。
*/
export async function run({
  origin, startHref, recordLowDomain = false, blockPathname = [],
  saveDataFolderName, savePathname, useProxy = false, onlyPage = false,
  breakCrawledHrefsQueue, breakWaitHrefsQueue, callback, customFun
}) {
  const tProxy = new TProxy()
  return new Promise(async function (resolve) {
    const crawledHrefsQueue = breakCrawledHrefsQueue || new Set() // 爬过的链接
    const waitHrefsQueue = breakWaitHrefsQueue || new Set() // 等待爬取的链接
    const lowDomain = new Set()  // 低级域名
    const { host } = new URL(startHref)
    const mainHost = host.split('.').slice(-3).join('.') // 当前域名的主域
    const folderName = saveDataFolderName // 数据保存文件夹，没填的话就默认以当前hostname为准
    let tempHref = startHref

    const crawler = new Crawler({
      maxConnections: 5,
      // 在每个请求处理完毕后将调用此回调函数
      callback: async function (error, res, done) {
        async function nextQueue() {
          let nextHrefs
          // 循环取出集合里下一个需要爬的href
          while (true) {
            const [href] = waitHrefsQueue
            waitHrefsQueue.delete(href) // 删除
            if (!href || !blockPathname.find(item => href.startsWith(item))) {
              nextHrefs = href
              break
            }
          }

          if (nextHrefs) {
            tempHref = origin + nextHrefs // 临时记录请求地址。
            if (useProxy) {
              let { ip, port } = await tProxy.getProxy()
              crawler.queue({
                uri: tempHref,
                proxy: `http://${ip}:${port}`,
                proxyIp: ip
              })
              log("下一个抓：", tempHref, "，使用：", ip, ':', port)
            } else {
              crawler.queue(tempHref)
              log("下一个抓：", tempHref)
            }
          }
          done()
        }

        if (error || res.statusCode > 400) {
          // ! 出错直接下一个
          log(folderName, "\t错误：：：当前等待队列中拥有:", waitHrefsQueue.size)
          // 写错误文件
          writeFile(folderName, errorFileName, (res.request?.uri?.href || (tempHref + '::状态::' + res.statusCode)) + '\n')
          // if (error && error.toString().indexOf('tunneling socket could not be established') != -1 && res.options.proxy) {
          if (res.statusCode === 503 && res.options.proxy && useProxy) {
            tProxy.addBlacks(res.options.proxyIp)
            await tProxy.requestProxys()
          }
          nextQueue()
        } else {
          const $ = res.$
          if ($ && res.request?.uri?.href?.includes(host)) {

            const currentHref = res.request.uri.href // 当前url完整地址
            // ! 处理文章逻辑
            customFun && customFun($, currentHref, folderName)

            // 抓取完成后，把上一次存的临时url,添加到已经抓取的set里，
            // 这里如果使用currentHref的话，会造成等待队列和完成队列不一直的问题，出现301死循环
            crawledHrefsQueue.add(new URL(tempHref).pathname)
            // 处理页面中所有的 a 标签
            $("a").each(function (_, a) {
              const href = $(a).attr('href')
              const finalyHref = handleHref(href, currentHref, mainHost)
              if (finalyHref) {
                // ! 二级域名要单独存起来
                let furl = new URL(finalyHref)
                if (recordLowDomain && host !== furl.host) {
                  if (!lowDomain.has(furl.origin) && !lowDomain.has(transformProtocol(furl.origin))) {
                    lowDomain.add(furl.origin)
                  }
                } else {
                  if (
                    !onlyPage &&  // ! onlyPage为false时，才开启全站抓取
                    (savePathname ? furl.pathname.startsWith(savePathname) : true) && // ! 只抓当前pathname下的文章
                    // crawledHrefsQueue.size + waitHrefsQueue.size < 1900000 &&    // ! 暂时不确定优化后最多有多少
                    !blockPathname.find(item => furl.pathname.startsWith(item)) && // ! 被阻拦的目录不需要抓取
                    // ! 已经爬过的href里没有才加入等待集合
                    !crawledHrefsQueue.has(furl.pathname) &&
                    // ! http 和 https 算一个, 结尾带反斜杠和不带的算一个
                    !crawledHrefsQueue.has(transformProtocol(furl.pathname)) &&
                    !crawledHrefsQueue.has(transformProtocol(transformEnds(furl.pathname))) &&
                    !crawledHrefsQueue.has(transformEnds(transformProtocol(furl.pathname))) &&
                    !crawledHrefsQueue.has(transformEnds(furl.pathname))) {
                    waitHrefsQueue.add(furl.pathname)
                  }
                }
              }
            })
          }
          log(folderName, "\t当前等待队列中拥有:", waitHrefsQueue.size, "\t---\t已完成队列拥有:", crawledHrefsQueue.size)
          // 写成功文件
          writeFile(folderName, 'crawledHrefsQueue.js', 'export default ' + JSON.stringify([...crawledHrefsQueue]), 'w')
          writeFile(folderName, 'waitHrefsQueue.js', 'export default ' + JSON.stringify([...waitHrefsQueue]), 'w')
          nextQueue()
        }
      }
    })

    crawler.on('drain', async () => {
      if (recordLowDomain && lowDomain.size !== 0) {
        // ! 检查所有低级域名的可访问性
        const { successDomain, errorDomain } = await checkStatus([...lowDomain])
        // 输出一下低级域名
        if (recordLowDomain) {
          writeFile(folderName, lowSuccessFileName, [...successDomain].join('\n'))
          writeFile(folderName, lowErrorFileName, [...errorDomain].join('\n'))
        }
        // ! 待完成自动抓取成功的低级域名 
        // if (crawlerLowDomain) {
        //   successDomain.forEach(item => {
        //     run({ startHost: item, disableCrawler, saveDataFolderName })
        //   })
        // }
      }
      if (waitHrefsQueue.size === 0) {
        if (callback) { await callback() }
        resolve()
      }
    })
    if (useProxy) {
      const { ip, port } = await tProxy.getProxy()
      crawler.queue({
        uri: startHref,
        proxy: `http://${ip}:${port}`,
        proxyIp: ip
      })
    } else {
      crawler.queue(startHref)
    }
  })
}