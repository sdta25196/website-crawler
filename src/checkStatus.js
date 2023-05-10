import Crawler from "crawler"

/**
*
* @author : 田源
* @date : 2023-05-10 16:16
* @description : 检查链接是否可用
* @param data Array, 需要检查的数据
* @param scuess Function, 成功回调函数
* @param error Function, 失败回调函数
*/
async function checkStatus(data) {
  return new Promise(res => {
    const errResult = []
    const sucessResult = []
    const crawler = new Crawler({
      maxConnections: 10,
      callback: function (err, res, done) {
        if (err || res.statusCode > 400) {
          errResult.push(res.request?.uri?.href)
        } else {
          sucessResult.push(res.request?.uri?.href)
        }
        done()
      }
    })
    crawler.on('drain', function () {
      res({
        successDomain: sucessResult,
        errorDomain: errResult
      })
    });
    crawler.queue(data)
  })
}

export default checkStatus