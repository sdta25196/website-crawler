import fs from "fs"
import path from "path"
import { saveDataPath } from '../src/type.js'

export function writeFile(folderName, fileName, content) {
  const folderPathName = path.join(saveDataPath, folderName)
  if (!fs.existsSync(folderPathName)) {
    fs.mkdirSync(folderPathName, { recursive: true })
  }
  fs.appendFile(path.join(folderPathName, fileName), content, () => { })
}

writeFile('xxx-xx', 'err.txt', 'xxxxxxxxx')
