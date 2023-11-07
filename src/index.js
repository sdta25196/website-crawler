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
* @param startHref `String` 爬虫的入口链接
* @param recordLowDomain `Boolean` 是否记录其他子域名，默认 false
* @param blockPathname `Array` 禁止爬取的链接数组 示例：`['/a', '/b']`
* @param saveDataFolderName `String` 自定义保存数据的文件夹，默认在: ./data/当前域名文件夹下
* @param callback `Function` 使用队列模式时的回调函数
* @param customFun `Function` 自定义处理函数，($, currentHref, folderName)=>{}
* @param onlyPage `Boolean` 是否只抓取当前页面，默认false, 可阻止全站爬取以及断点续传时继续加入队列。
*/
export async function run({
  startHref, recordLowDomain = false, blockPathname = [],
  saveDataFolderName, limitPathname, useProxy = false, onlyPage = false,
  breakCrawledHrefsQueue, breakWaitHrefsQueue, callback, customFun
}) {
  const tProxy = new TProxy()
  return new Promise(async function (resolve) {
    // 爬过的链接
    const crawledHrefsQueue = breakCrawledHrefsQueue || new Set()
    // 等待爬取的链接
    const waitHrefsQueue = breakWaitHrefsQueue || new Set()
    // 其他子域名
    const lowDomain = new Set()
    const { host, hostname, origin } = new URL(startHref)
    const folderName = saveDataFolderName || hostname
    let tempHref = startHref
    const nextQueue = async (done) => {
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

    const crawler = new Crawler({
      maxConnections: 5,
      // 在每个请求处理完毕后将调用此回调函数
      callback: async function (error, res, done) {
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
          nextQueue(done)
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
              const finalyHref = handleHref(href, currentHref)
              if (finalyHref) {
                let furl = new URL(finalyHref)
                // ! 其他子域名要单独存起来
                if (host !== furl.host) {
                  if (recordLowDomain && !lowDomain.has(furl.origin) && !lowDomain.has(transformProtocol(furl.origin))) {
                    lowDomain.add(furl.origin)
                  }
                } else {
                  if (
                    // ! onlyPage 为 false 时，才开启全站抓取
                    !onlyPage &&
                    // ! 如果开启了 pathname 限制，则只抓指定的 pathname 
                    (limitPathname ? furl.pathname.startsWith(limitPathname) : true) &&
                    // ! 暂时不确定优化后最多有多少
                    // crawledHrefsQueue.size + waitHrefsQueue.size < 1900000 &&    
                    // ! 被阻拦的目录不需要抓取
                    !blockPathname.find(item => furl.pathname.startsWith(item)) &&
                    // ! 已经爬过的href里没有才加入等待集合
                    !crawledHrefsQueue.has(furl.pathname) &&
                    // ! 结尾带斜杠和不带的按一个算
                    !crawledHrefsQueue.has(transformEnds(furl.pathname))
                  ) {
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
          nextQueue(done)
        }
      }
    })

    crawler.on('drain', async () => {
      if (lowDomain.size !== 0) {
        // ! 检查所有子域名的可访问性
        const { successDomain, errorDomain } = await checkStatus([...lowDomain])
        // 保存一下其他子域名
        writeFile(folderName, lowSuccessFileName, [...successDomain].join('\n'))
        writeFile(folderName, lowErrorFileName, [...errorDomain].join('\n'))
        // ! 待完成自动抓取成功的子域名功能 
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