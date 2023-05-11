import fs from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const folderPath = join(__dirname, '../data/')

// 查找文件夹下所有的文件
function findJsonFile(path, jsonFiles) {
  let files = fs.readdirSync(path);
  files.forEach(item => {
    let fPath = join(path, item);
    let stat = fs.statSync(fPath);
    if (stat.isDirectory() === true) {
      findJsonFile(fPath, jsonFiles);
    }
    if (stat.isFile() === true) {
      jsonFiles.push(fPath);
    }
  });
}

// 根据指定正则,获取数据量
function getLineFromRegex(jsonFiles) {
  let allLine = 0 // 获取所有文件的总行数
  let regexLine = 0 // 获取匹配的内容总行数
  jsonFiles.forEach(item => {
    const data = fs.readFileSync(item, 'UTF-8')
    if (item.endsWith('hrefs.txt')) {
      data.split('\n').forEach(str => {
        allLine++
        if (str.match(/\/info\/\d+\/\d+.htm/)) regexLine++
      })
    }
  })
  return { regexLine, allLine }
}


function run() {
  let jsonFiles = []
  findJsonFile(folderPath, jsonFiles)
  let { regexLine: articleLine, allLine } = getLineFromRegex(jsonFiles)
  return { articleLine, allLine }
}

console.log(run())