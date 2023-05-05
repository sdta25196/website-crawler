import fs from "fs"
import path from "path"
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function writeFile(folderName, fileName, content) {
  const folderPath = path.join(__dirname, '../data/' + folderName)
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }
  fs.appendFile(path.join(folderPath, fileName), content, () => { })
}

writeFile('xxx-xx', 'err.txt', 'xxxxxxxxx')
