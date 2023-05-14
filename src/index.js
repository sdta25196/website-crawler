import Crawler from "crawler"
import { handleHref, log, transformEnds, transformProtocol, writeFile } from "./tools.js"
import checkStatus from "./checkStatus.js"
import { sucessFileName, errorFileName, lowSuccessFileName, lowErrorFileName } from './type.js'
/**
*
* @author : 田源
* @date : 2023-05-05 14:36
* @description : 爬虫主函数
* @param startHost `String` 爬虫开始的域名
* @param recordLowDomain `Boolean` 是否记录低级域名，默认 true, 不建议关闭
* @param crawlerLowDomain `Boolean` 是否爬取低级域名，默认 false
* @param disableCrawler `Array` 禁止爬取的链接数组
* @param saveDataFolderName `String` 自定义保存数据的文件夹，建议填一个，默认 `/data`
*/
function run({ startHost, recordLowDomain = true, crawlerLowDomain = false, disableCrawler = [], saveDataFolderName }) {
  // 黑名单的链接不抓
  if (disableCrawler.includes(startHost)) return

  const crawledHrefsQueue = new Set() // 爬过的链接
  const waitHrefsQueue = new Set() // 等待爬取的链接
  const lowDomain = new Set()  // 低级域名
  const { host, hostname } = new URL(startHost)
  const mainHost = host.split('.').slice(-3).join('.') // 当前域名的主域
  const folderName = (saveDataFolderName || '.') + '/' + hostname // 数据保存文件夹，没填的话就默认以当前hostname为准
  let tempHref = startHost

  const crawler = new Crawler({
    maxConnections: 1,
    // 在每个请求处理完毕后将调用此回调函数
    callback: function (error, res, done) {
      function nextQueue() {
        const [nextHrefs] = waitHrefsQueue // 取出集合里下一个需要爬的href
        waitHrefsQueue.delete(nextHrefs) // 删除
        crawler.queue(nextHrefs)
        tempHref = nextHrefs // 临时记录请求地址。
        log("下一个抓：", nextHrefs)
      }
      if (error || res.statusCode > 400) {
        // ! 出错直接下一个
        log(folderName, "\t错误：：：当前等待队列中拥有:", waitHrefsQueue.size)
        nextQueue()
        writeFile(folderName, errorFileName, (res.request?.uri?.href || (tempHref + '::状态::' + res.statusCode)) + '\n')
      } else {
        const $ = res.$
        if ($) {
          writeFile(folderName, sucessFileName, (res.request?.uri?.href) + '\n')
          const currentOrigin = res.request.uri.protocol + '//' + res.request.uri.host // 当前域名
          const currentHref = res.request.uri.href // 当前url完整地址
          // 抓取完成后，把上一次存的临时url,添加到已经抓取的set里，
          // 这里如果使用currentHref的话，会造成等待队列和完成队列不一直的问题，出现301死循环
          crawledHrefsQueue.add(tempHref)
          // 处理页面中所有的 a 标签
          $("a").each(function (_, a) {
            const href = $(a).attr('href')
            const finalyHref = handleHref(href, currentHref, mainHost)
            if (finalyHref) {
              // ! 二级域名要单独存起来
              let curl = new URL(currentOrigin) // TODO 这里有问题啊。如果页面301到了一个新的地址，这里就变成新的地址了，于是就重复l
              let furl = new URL(finalyHref)
              if (recordLowDomain && curl.host !== furl.host) {
                if (!lowDomain.has(furl.origin) && !lowDomain.has(transformProtocol(furl.origin))) {
                  lowDomain.add(furl.origin)
                }
              } else {
                // ! 已经爬过的href里没有才加入等待集合。http 和 https 算一个, 结尾带反斜杠和不带的算一个
                if (!crawledHrefsQueue.has(finalyHref) &&
                  !crawledHrefsQueue.has(transformProtocol(finalyHref)) &&
                  !crawledHrefsQueue.has(transformProtocol(transformEnds(finalyHref))) &&
                  !crawledHrefsQueue.has(transformEnds(transformProtocol(finalyHref))) &&
                  !crawledHrefsQueue.has(transformEnds(finalyHref))) {
                  waitHrefsQueue.add(finalyHref)
                }
              }
            }
          })
        }
        log(folderName, "\t当前等待队列中拥有:", waitHrefsQueue.size, "\t---\t已完成队列拥有:", crawledHrefsQueue.size)
        nextQueue()
      }
      done()
    }
  })

  crawler.on('drain', async () => {
    // ! 检查所有低级域名的可访问性
    const { successDomain, errorDomain } = await checkStatus([...lowDomain])
    // 输出一下低级域名
    if (recordLowDomain) {
      writeFile(folderName, lowSuccessFileName, [...successDomain].join('\n'))
      writeFile(folderName, lowErrorFileName, [...errorDomain].join('\n'))
    }
    // 自动抓取成功的低级域名
    if (crawlerLowDomain) {
      successDomain.forEach(item => {
        if (item.includes('https://xxgk.nju.edu.cn')) {
          console.log(item)
          run({ startHost: item, disableCrawler, saveDataFolderName })
        }
      })
    }
  })
  crawler.queue(startHost)
}



// ! 清华大学  https://www.tsinghua.edu.cn/     181万收录
// ! 菏泽学院  https://www.hezeu.edu.cn/        26万收录
// ! 泰安一中  https://www.tadyz.com/          3万收录
// run({
//   startHost: 'https://www.tadyz.com/ ',
// })

run({
  startHost: 'https://www.nju.edu.cn/',
  crawlerLowDomain: true,
  saveDataFolderName: '222'
})