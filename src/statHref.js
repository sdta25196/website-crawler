import fs from 'fs'
import { join } from 'path'
import { saveDataPath, sucessFileName } from './type.js'

/** 查找文件夹下所有的文件 */
function findFiles(path, filesArray) {
  let dirOrFile = fs.readdirSync(path)
  dirOrFile.forEach(item => {
    let fPath = join(path, item)
    let stat = fs.statSync(fPath)
    if (stat.isDirectory()) {
      findFiles(fPath, filesArray)
    }
    if (stat.isFile()) {
      filesArray.push(fPath)
    }
  })
}

/** 根据指定正则,获取数据量, 正则默认是 `/info/\d+/\d+.htm` */
function getLineFromRegex(files, regex = /\/info\/\d+\/\d+.htm/) {
  let allLine = 0 // 获取所有文件的总行数
  let regexLine = 0 // 获取匹配的内容总行数
  files.forEach(item => {
    const data = fs.readFileSync(item, 'UTF-8')
    if (item.endsWith(sucessFileName)) {
      data.split('\n').forEach(str => {
        allLine++
        if (str.match(regex)) regexLine++
      })
    }
  })
  return { regexLine, allLine }
}


function run() {
  let files = []
  findFiles(saveDataPath, files)
  let { regexLine: articleLine, allLine } = getLineFromRegex(files)
  return { articleLine, allLine }
}

console.log(run())