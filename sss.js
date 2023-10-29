import Crawler from "crawler"

let hrefs = ['https://www.baidu.com']

/**
*
* @author : 田源
* @date : 2023-10-14 09:11
* @description :  检查某网站的全部目录
*
*/

async function run() {
  const crawledHrefsQueue = new Set()
  const crawler = new Crawler({
    maxConnections: 10,
    // 在每个请求处理完毕后将调用此回调函数
    callback: async function (error, res, done) {
      if (error || res.statusCode > 400) {
        // ! 出错直接下一个
        console.log(res.request?.uri?.href, "\t错误：：：当前等待队列中拥有:", crawledHrefsQueue.size)
      } else {
        const $ = res.$
        if ($) {
          $("a").each(function (_, a) {
            const href = new URL($(a).attr('href'), res.request?.uri?.href).href
            if (href.match(/https:\/\/www.baidu.com\/zongjie\/.+/)) { // ! 找出匹配的二级目录
              crawledHrefsQueue.add(href)
            }
          })
        }
      }
      done()
    }
  })

  crawler.on('drain', async () => {
    console.log(crawledHrefsQueue.size)
    crawledHrefsQueue.forEach(x => {
      console.log(x)
    })
  })

  crawler.queue(hrefs)
}

run()