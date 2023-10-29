import Crawler from "crawler"
import { entryToStr, handleHref, isJsRender, log, transformEnds, transformProtocol, writeFile } from "./tools.js"
import checkStatus from "./checkStatus.js"
import { sucessFileName, errorFileName, lowSuccessFileName, lowErrorFileName } from './type.js'
import TProxy from './proxy.js'

// ! 队列版

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
async function run({ startHost, recordLowDomain = true, crawlerLowDomain = false, disableCrawler = [], saveDataFolderName, savePathname, callback }) {
  const tProxy = new TProxy()
  return new Promise(async function (resolve) {
    // 黑名单的链接不抓
    if (disableCrawler.includes(startHost)) return

    const crawledHrefsQueue = new Set() // 爬过的链接
    const waitHrefsQueue = new Set() // 等待爬取的链接
    const lowDomain = new Set()  // 低级域名
    const { host, pathname } = new URL(startHost)
    const mainHost = host.split('.').slice(-3).join('.') // 当前域名的主域
    const folderName = saveDataFolderName // 数据保存文件夹，没填的话就默认以当前hostname为准
    // const folderName = (saveDataFolderName || '.') + '/' + hostname // 数据保存文件夹，没填的话就默认以当前hostname为准
    let tempHref = startHost

    const crawler = new Crawler({
      maxConnections: 40,
      // 在每个请求处理完毕后将调用此回调函数
      callback: async function (error, res, done) {
        async function nextQueue() {
          const [nextHrefs] = waitHrefsQueue // 取出集合里下一个需要爬的href
          waitHrefsQueue.delete(nextHrefs) // 删除
          if (nextHrefs) {
            let { ip, port, user, pwd } = await tProxy.getProxy()
            crawler.queue({
              uri: nextHrefs,
              // ! 注释下两行关闭代理
              proxy: `http://${user}:${pwd}@${ip}:${port}`,
              proxyIp: ip
            })
            tempHref = nextHrefs // 临时记录请求地址。
            log("下一个抓：", nextHrefs, "使用：", ip, port)
          }
          done()
        }

        if (error || res.statusCode > 400) {
          // ! 出错直接下一个
          log(folderName, "\t错误：：：当前等待队列中拥有:", waitHrefsQueue.size)
          writeFile(folderName, errorFileName, (res.request?.uri?.href || (tempHref + '::状态::' + res.statusCode)) + '\n')
          if (error && error.toString().indexOf('tunneling socket could not be established') != -1 && res.options.proxy) {
            // const currtentIp = res.options.proxy.match(/@(.+):/)[1]
            tProxy.addBlacks(res.options.proxyIp)
            await tProxy.requestProxys()
          }
          nextQueue()
        } else {
          const $ = res.$
          if ($ && res.request?.uri?.href?.includes(host)) {

            const jsRender = isJsRender($)
            // ! 301问题，这里使用tempHref写入文件，如果写入(res.request?.uri?.href)，会存在文件内重复的情况
            writeFile(folderName, sucessFileName, tempHref + (jsRender ? '\t疑似JS渲染\t' : '') + '\n')

            const currentHref = res.request.uri.href // 当前url完整地址
            // ! 处理文章逻辑
            if (currentHref.endsWith('.htm') || currentHref.endsWith('.html')) {
              const content = $('.content')?.html()
              const title = $('.title')?.text()
              if (content && title) {
                let id = currentHref.match(/(\d+)\.html?/)?.[1] || title
                let obj = { title, content: entryToStr(content), url: currentHref }
                writeFile(folderName, `${id}.json`, JSON.stringify(obj), 'w')
              }
            }
            // 抓取完成后，把上一次存的临时url,添加到已经抓取的set里，
            // 这里如果使用currentHref的话，会造成等待队列和完成队列不一直的问题，出现301死循环
            crawledHrefsQueue.add(tempHref)
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
                  // ! 已经爬过的href里没有才加入等待集合。http 和 https 算一个, 结尾带反斜杠和不带的算一个
                  // TODO域名判断需要修改成全等,只判断一级的。或者一二级均判断。
                  if (furl.pathname.startsWith(savePathname) || furl.pathname.startsWith(pathname) && // ! 只抓当前pathname下的文章
                    crawledHrefsQueue.size + waitHrefsQueue.size < 1900000 && // 最多两百万
                    !crawledHrefsQueue.has(finalyHref) &&
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
          // 等一秒
          // const t = Date.now()
          // while (t + 1000 > Date.now());
          nextQueue()
        }
      }
    })

    crawler.on('drain', async () => {
      // if (lowDomain.size !== 0) {
      //   // ! 检查所有低级域名的可访问性
      //   const { successDomain, errorDomain } = await checkStatus([...lowDomain])
      //   // 输出一下低级域名
      //   if (recordLowDomain) {
      //     writeFile(folderName, lowSuccessFileName, [...successDomain].join('\n'))
      //     writeFile(folderName, lowErrorFileName, [...errorDomain].join('\n'))
      //   }
      //   // 自动抓取成功的低级域名
      //   if (crawlerLowDomain) {
      //     successDomain.forEach(item => {
      //       run({ startHost: item, disableCrawler, saveDataFolderName })
      //     })
      //   }
      // }
      if (waitHrefsQueue.size === 0) {
        if (callback) { await callback() }
        resolve()
      }
    })

    // crawler.queue(startHost)
    const { ip, port, user, pwd } = await tProxy.getProxy()
    crawler.queue({
      uri: startHost,
      // ! 注释下两行关闭代理
      proxy: `http://${user}:${pwd}@${ip}:${port}`,
      proxyIp: ip
    })
  })
}

let a = ['https://www.baidu.com/abc']

class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }
}

// 创建一个长度为100的队列
const queue = new Queue();
for (let i = 1; i <= a.length; i++) {
  queue.enqueue(a[i]);
}
console.log(queue.size())

// 并发执行前十个任务
async function processQueue() {
  const tasks = [];

  // 取出前十个任务
  for (let i = 0; i < 2; i++) {
    const task = queue.dequeue();
    tasks.push(run({
      startHost: task, // ! 域名 + 目录。仅抓取此目录下文章
      saveDataFolderName: 'baidu/' + task.replace('https://www.baidu.com/', ''), // ! 设置文件放置位置
      callback: nextTask
    }));
  }
  const nextTask = async () => {
    while (!queue.isEmpty()) {
      const task = queue.dequeue();
      await run({
        startHost: task, // ! 域名 + 目录。仅抓取此目录下文章
        saveDataFolderName: 'baidu/' + task.replace('https://www.baidu.com/', ''), // ! 设置文件放置位置
        callback: nextTask
      });
    }
  }

  // 并发执行前十个任务
  await Promise.all(tasks);
}

// 启动程序
processQueue()
  .then(() => {
    console.log("所有任务已完成");
  })
  .catch((error) => {
    console.error("程序出错:", error);
  });