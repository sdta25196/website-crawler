import Crawler from "crawler"
import fs from "fs"
import checkStatus from "../src/checkStatus.js"
// import data from "./a.js"

var data = [
  'https://www.gdou.edu.cn/info/1091/49599.htm',
  'https://www.gdou.edu.cn/info/1091/49640.htm',
  'https://www.gdou.edu.cn/info/1091/49509.htm',
  'https://www.gdou.edu.cn/info/1091/49844.htm',
  'https://www.gdou.edu.cn/info/1091/49841.htm',
  'https://www.gdou.edu.cn/info/1091/49769.htm',
  'https://www.gdou.edu.cn/info/1091/49846.htm',
  'https://www.gdou.edu.cn/info/1091/49849.htm',
  'https://www.gdou.edu.cn/info/1091/49790.htm',
  'https://www.gdou.edu.cn/info/1091/49765.htm',
  'https://www.gdou.edu.cn/info/1091/49758.htm',
  'https://www.gdou.edu.cn/info/1094/49659.htm',
  'https://www.gdou.edu.cn/info/1094/49854.htm',
  'https://www.gdou.edu.cn/info/1094/49855.htm',
  'https://www.gdou.edu.cn/info/1094/49825.htm',
  'https://www.gdou.edu.cn/info/1094/49766.htm',
  'https://www.gdou.edu.cn/info/1095/49628.htm',
  'https://www.gdou.edu.cn/info/1095/49617.htm',
  'https://www.gdou.edu.cn/info/1095/49171.htm',
  'https://www.gdou.edu.cn/info/1095/49162.htm',
  'https://www.gdou.edu.cn/info/1093/49764.htm',
  'https://www.gdou.edu.cn/info/1093/49853.htm',
  'https://www.gdou.edu.cn/info/1093/49847.htm',
]


function test(x) {
  /** 检测错误链接 */
  const crawler = new Crawler({
    maxConnections: 10,
    // 在每个请求处理完毕后将调用此回调函数
    callback: function (error, res, done) {
      if (error || res.statusCode > 400) {
        console.log("失败")
        // fs.appendFile(
        //   '404.txt',
        //   (res.request?.uri?.href || (':::::::::::::状态::' + res.statusCode)) + '\n',
        //   (err) => { }
        // )
      }
      console.log("成功", crawler.queueSize)
      done()
    }
  })

  console.time()
  crawler.on('drain', async function () {
    console.timeEnd()
    console.log(x)
    const { successDomain, errorDomain } = await checkStatus([...data])
    console.log(successDomain, errorDomain)
    // if (!x) {
    //   test(1)
    // }
  });
  crawler.queue(data)
}

test()