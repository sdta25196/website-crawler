import fs from "fs"
import path from "path"
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


/** 检测文件，并写入data文件夹下 */
export function writeFile(folderName, fileName, content) {
  const folderPath = path.join(__dirname, '../data/' + folderName)
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }
  fs.appendFile(path.join(folderPath, fileName), content, () => { })
}


export function log(...str) {
  process.stdout.write(str.join('') + '\n')
}

/** 转换http与https */
export function transformHTTP(href) {
  if (href.startsWith('http://')) return href.replace('http://', 'https://')
  if (href.startsWith('https://')) return href.replace('https://', 'http://')
  return href
}

/** 转换结尾斜杠 */
export function transformEnds(href) {
  if (href.endsWith('/')) return href.replace(/\/$/, '')
  return href + '/'
}

export function handleHref(href, currentHref, mainHost) {

  // ! 非法链接不要
  if (!href) return ''

  // ! 链接 javascript 开头的不要
  if (href.startsWith('javascript')) return ''

  // ! 文件链接不要 
  if (href.endsWith('.zip') || href.endsWith('.doc') || href.endsWith('.png') || href.endsWith('.jpg')) return ''

  // ! 锚点不要
  if (href.indexOf('#') !== -1) {
    href = href.split('#')[0]
  }
  // ! 邮箱跳转不要
  if (href.indexOf('mailto:') !== -1) return ''

  if (!href.startsWith('http')) {
    href = absolutify(currentHref, href)
  }

  // ! 非本站主域名链接不要
  if (href.indexOf(mainHost) === -1) return ''

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
