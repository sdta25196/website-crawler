import request from 'request'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// const imgSrc = 'http://img.gaosan.com/upload/202308/20230804170227681.jpg'
// let filename = imgSrc.split('/').pop() // 已原网络图片的名称命名本地图片
// request({ url: imgSrc }).pipe(
//   fs.createWriteStream(path.resolve(__dirname, `../images/`) + '/' + filename).on('close', err => {
//     if (err) {
//       console.log('写入失败', err)
//     }
//   })
// )

export default function downImg(imgSrc) {
  let filename = imgSrc.split('/').pop() // 已原网络图片的名称命名本地图片
  request({ url: imgSrc }).pipe(
    fs.createWriteStream(path.resolve(__dirname, `../images/`) + '/' + filename).on('close', err => {
      if (err) {
        console.log('写入失败', err)
      }
      console.log(imgSrc)
    })
  )
}