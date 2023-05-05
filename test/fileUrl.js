import Crawler from "crawler"
import fs from "fs"
import data from "./a.js"

/** 检测错误链接 */
const crawler = new Crawler({
  maxConnections: 10,
  // 在每个请求处理完毕后将调用此回调函数
  callback: function (error, res, done) {
    if (error || res.statusCode > 400) {
      console.log("失败")
      fs.appendFile(
        '404.txt',
        (res.request?.uri?.href || (':::::::::::::状态::' + res.statusCode)) + '\n',
        (err) => { }
      )
    }
    console.log("成功")
    done()
  }
})

crawler.queue(data)