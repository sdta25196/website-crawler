import Crawler from "crawler"
import { handleHref, log, writeFile } from "./tools.js"

/**
*
* @author : 田源
* @date : 2023-05-05 14:36
* @description : 爬虫主函数
* @param mainHost 网站主域名
* @param startHost 爬虫开始的域名
* @param recordLowHost 是否记录二级域名，默认不记录
*/
function run({ mainHost, startHost, recordLowHost = false }) {
  const crawledHrefsQueue = new Set() // 爬过的链接
  const waitHrefsQueue = new Set() // 等待爬取的链接
  const lowHost = new Set()  // 二级域名
  let tempHref = ''
  const folderName = startHost.replace(/https?:\/\//, '').replace(/\//g, '') // 文件夹名称

  var crawler = new Crawler({
    maxConnections: 3,
    // 在每个请求处理完毕后将调用此回调函数
    callback: function (error, res, done) {
      if (error || res.statusCode > 400) {
        // ! 出错直接下一个
        const [nextHrefs] = waitHrefsQueue // 取出集合里下一个需要爬的href
        waitHrefsQueue.delete(nextHrefs) // 删除
        crawler.queue(nextHrefs)
        log("错误：：：当前等待队列中拥有:", waitHrefsQueue.size, "\n下一个抓：", nextHrefs)
        writeFile(folderName, 'err.txt', (res.request?.uri?.href || (tempHref + '::状态::' + res.statusCode)) + '\n')
      } else {
        var $ = res.$
        if ($) {
          writeFile(folderName, 'hrefs.txt', (res.request?.uri?.href || (tempHref + '::状态::' + res.statusCode)) + '\n')
          const currentOrigin = res.request.uri.protocol + '//' + res.request.uri.host // 当前域名
          const currentHref = res.request.uri.href// 当前域名
          crawledHrefsQueue.add(currentHref) // 抓完一个之后，存到已经抓取的set里
          // 它是核心jQuery的精简实现，可以按照jQuery选择器语法快速提取DOM元素
          $("a").each(function (_, a) {
            const href = $(a).attr('href')
            const finalyHref = handleHref(href, currentOrigin, mainHost)
            if (finalyHref) {
              // ! 二级域名要单独存起来
              if (recordLowHost && !finalyHref.startsWith(currentOrigin)) {
                lowHost.add(finalyHref)
              } else {
                // ! 已经爬过的href里没有才加入等待集合。
                if (!crawledHrefsQueue.has(finalyHref)) {
                  waitHrefsQueue.add(finalyHref)
                }
              }
            }
          })
        }
        const [nextHrefs] = waitHrefsQueue // 取出集合里下一个需要爬的href
        waitHrefsQueue.delete(nextHrefs) // 删除
        crawler.queue(nextHrefs)
        tempHref = nextHrefs // 临时记录请求地址。
        log("当前等待队列中拥有:", waitHrefsQueue.size, "\n下一个抓：", nextHrefs)
      }
      // 输出一下二级页面
      if (recordLowHost && waitHrefsQueue.size === 1) {
        writeFile(folderName, 'lowHost.txt', '\n\n\n' + [...lowHost].toString() + '\n',)
      }
      done()
    }
  })

  crawler.queue(startHost)
}

// ! 清华大学  https://www.tsinghua.edu.cn/     181万收录
// ! 菏泽学院  https://www.hezeu.edu.cn/        26万收录
// ! 泰安一中  https://www.tadyz.com/          3万收录
run({
  mainHost: 'hezeu.edu.cn',
  startHost: 'https://www.hezeu.edu.cn/',
})