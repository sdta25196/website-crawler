import { creditsailingCustom } from "../src/customFuns.js"
import { run } from "../src/index.js"
import { readJs } from "../src/tools.js"

/** 单任务全站抓取 */

const { origin, href } = new URL('http://www.baidu.com/')

// ! 断点续传逻辑
// const breakCrawledHrefsQueue = await readJs('../data' + '/creditsailing' + '/crawledHrefsQueue.js')
// const breakWaitHrefsQueue = await readJs('../data' + '/creditsailing' + '/waitHrefsQueue.js')

await run({
  origin: origin,
  startHref: href,
  saveDataFolderName: 'creditsailing', // ! 保存文件的目录
  customFun: creditsailingCustom,
  // savePathname: pathname // ! 指定的抓取目录, 不传就不分目录
  // blockPathname: ['/article'], // ! article 抓完了
  // breakCrawledHrefsQueue,
  // breakWaitHrefsQueue,
  useProxy: true
})