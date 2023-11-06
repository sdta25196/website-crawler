import { creditsailingCustom } from "../src/customFuns.js"
import { run } from "../src/index.js"

/** 循环排队抓目录 */

let hrefs = ["http://www.baidu.com/article/"]

for (let i = 0; i < hrefs.length; i++) {

  const { origin, pathname, href } = new URL(hrefs[i])
  // ! 断点续传逻辑
  // const breakCrawledHrefsQueue = await readJs('../data' + '/article' + '/crawledHrefsQueue.js')
  // const breakWaitHrefsQueue = await readJs('../data' + '/article' + '/waitHrefsQueue.js')
  await run({
    origin: origin,
    startHref: href,
    saveDataFolderName: pathname, // ! 保存文件的目录
    savePathname: pathname, // ! 指定的抓取目录
    customFun: creditsailingCustom,
    // breakCrawledHrefsQueue,
    // breakWaitHrefsQueue,
    useProxy: true
  })
}
