import path from "path"
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** 存放数据的文件夹路径 */
export const saveDataPath = path.join(__dirname, '../data/')
/** 链接访问成功存放的文件名称 */
export const sucessFileName = 'hrefs.txt'
/** 链接访问失败存放的文件名称 */
export const errorFileName = 'err.txt'
/** 低级域名链接访问成功存放的文件名称 */
export const lowSuccessFileName = 'lowSuccessDomain.txt'
/** 低级域名链接访问失败存放的文件名称 */
export const lowErrorFileName = 'lowErrorDomain.txt'