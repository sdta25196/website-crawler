import { entryToStr, writeFile } from "./tools.js"

/** 高考升学网 文章处理逻辑 */
export const creditsailingCustom = ($, currentHref, folderName) => {
  if (/\/\d+\.html?$/.test(currentHref)) {
    const content = $('.article')?.text()
    const title = $('h1')?.text()
    if (content && title) {
      const publish_time = $('.sound')?.text()?.match(/\d.+\d/)?.[0]
      let obj = { type: "3", title, content: entryToStr(content), source: currentHref, publish_time }
      let date = new Date()
      let month = date.getMonth() + 1 // 月份从 0 开始，因此需要加 1
      let day = date.getDate()
      let hour = date.getHours()
      writeFile(folderName, `${month}-${day}-${hour}.log`, JSON.stringify(obj) + '\n')
    }
  }
}