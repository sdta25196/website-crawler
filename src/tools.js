import fs from "fs"
import path from "path"
import { saveDataPath } from './type.js'


/** 检测文件，并写入保存数据的文件夹 */
export function writeFile(folderName, fileName, content) {
  const folderPathName = path.join(saveDataPath, folderName)
  if (!fs.existsSync(folderPathName)) {
    fs.mkdirSync(folderPathName, { recursive: true })
  }
  fs.appendFile(path.join(folderPathName, fileName), content, () => { })
}


export function log(...str) {
  process.stdout.write(str.join('') + '\n')
}

/** 转换http与https */
export function transformProtocol(href) {
  if (href.startsWith('http://')) return href.replace('http://', 'https://')
  if (href.startsWith('https://')) return href.replace('https://', 'http://')
  return href
}

/** 转换结尾斜杠 */
export function transformEnds(href) {
  if (href.endsWith('/')) return href.replace(/\/$/, '')
  return href + '/'
}

/** 判断是否是JS渲染 */
export function isJsRender($) {
  // 使用 script[type="text/html"] ，并且内容有 {{ xxx }} , 就证明此页面使用的模板
  if ($('script[type="text/html"]').text().match(/{{.[^}]+}}/)) return true
  return false
}

export function handleHref(href, currentHref, mainHost) {

  // ! 非法链接不要
  if (!href) return ''

  // ! 链接 javascript 开头的不要
  if (href.startsWith('javascript')) return ''

  // ! 文件链接不要 
  if (
    href.endsWith('.zip') || href.endsWith('.rar') || href.endsWith('.pdf') || href.endsWith('.doc') || href.endsWith('.docx') ||
    href.endsWith('.png') || href.endsWith('.jpg') || href.endsWith('.avi') || href.endsWith('.xls') || href.endsWith('.xlsx') ||
    href.endsWith('.gif') || href.endsWith('.txt') || href.endsWith('.csv') || href.endsWith('.mp4')
  ) return ''

  // ! 锚点不要
  if (href.indexOf('#') !== -1) return ''

  // ! 邮箱、电话、短信、位置不要
  if (href.indexOf('mailto:') !== -1 || href.indexOf('tel:') !== -1 || href.indexOf('sms:') !== -1 || href.indexOf('geopoint:') !== -1) return ''

  if (!href.startsWith('http')) {
    href = absolutify(currentHref, href)
  }

  // ! 非本站主域名链接不要
  if (href.indexOf(mainHost) === -1) return ''

  // ! 验证href是否合法
  try {
    new URL(href)
  } catch (e) {
    return ''
  }

  return href
}

// 相对路径修改
function absolutify(fullUrl = '', relativeUrl = '') {
  try {
    const result = new URL(relativeUrl, fullUrl)
    return result.toString()
  } catch (err) {
    return ''
  }
}
