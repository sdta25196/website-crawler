import Crawler from "crawler"
import TProxy from '../src/proxy.js'

async function test() {
  /** 检测错误链接 */
  const crawler = new Crawler({
    maxConnections: 10,
    // 在每个请求处理完毕后将调用此回调函数
    callback: async function (error, res, done) {
      if (error || res.statusCode > 400) {
        console.log("失败", res.options.proxy)
        if (error.toString().indexOf('tunneling socket could not be established') != -1 && res.options.proxy) {
          // const currtentIp = res.options.proxy.match(/@(.+):/)[1]
          tProxy.addBlacks(res.options.proxyIp)
          await tProxy.requestProxys()
          const { ip, port, user, pwd } = await tProxy.getProxy()
          console.log({ ip, port, user, pwd })
          crawler.queue({
            uri: res.options.uri,
            proxy: `http://${user}:${pwd}@${ip}:${port}`,
            proxyIp: ip
          })
        }
        return
      }
      console.log("成功", crawler.queueSize)
      console.log(res.$('h3').text())
      done()
    }
  })

  crawler.on('drain', async function () {
    console.log('完成')
  })

  const { ip, port, user, pwd } = await tProxy.getProxy()

  console.log({ ip, port, user, pwd })

  crawler.queue({
    uri: "https://news.tongji.edu.cn/info/1003/83699.htm",
    proxy: `httP://${user}:${pwd}@${ip}:${port}`,
    // uri: "http://www.dxsxcn.com/xinxi/3900.html",
    // proxy: `httP://430079813c5af7aa:165563552985467@180.118.243.217:31101`,
    proxyIp: ip
  })
}

const tProxy = new TProxy()
await tProxy.requestProxys()

test()

