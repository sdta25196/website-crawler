
import { creditsailingCustom } from "../src/customFuns.js"
import { run } from "../src/index.js"

/** 队列多任务抓目录 */

let list = [
  "http://www.creditsailing.com/daxue/yiben/",
  "http://www.creditsailing.com/daxue/erben/",
  "http://www.creditsailing.com/daxue/sanben/",
  "http://www.creditsailing.com/daxue/minban/",
  "http://www.creditsailing.com/daxue/zhuanke/",
  "http://www.creditsailing.com/daxue/shuangyiliu/",
  "http://www.creditsailing.com/daxue/985/",
  "http://www.creditsailing.com/daxue/211daxue/",
]

class Queue {
  constructor() {
    this.items = []
  }

  enqueue(item) {
    this.items.push(item)
  }

  dequeue() {
    return this.items.shift()
  }

  isEmpty() {
    return this.items.length === 0
  }

  size() {
    return this.items.length
  }
}

// 创建一个队列
const queue = new Queue()

list.forEach(item => queue.enqueue(item))



// 并发执行前N个任务
async function processQueue() {
  // 保存的文件夹
  const FolderName = "baidu"
  // 任务
  const tasks = []

  const nextTask = async () => {
    while (!queue.isEmpty()) {
      const task = queue.dequeue()
      const { href, pathname } = new URL(task)

      await run({
        startHref: href,
        saveDataFolderName: FolderName,
        limitPathname: pathname, // ! 指定的抓取目录, 不传就不分目录
        customFun: creditsailingCustom,
        useProxy: false,
        callback: nextTask
      })
    }
  }


  // 取出前N个任务
  for (let i = 0; i < 2; i++) {
    const task = queue.dequeue()
    const { href, pathname } = new URL(task)
    tasks.push(run({
      startHref: href,
      saveDataFolderName: FolderName,
      limitPathname: pathname, // ! 指定的抓取目录, 不传就不分目录
      customFun: creditsailingCustom,
      useProxy: false,
      callback: nextTask
    }))
  }
  // 并发执行前十个任务
  await Promise.all(tasks)
}

// 启动程序
processQueue()
  .then(() => {
    console.log("所有任务已完成")
  })
  .catch((error) => {
    console.error("程序出错:", error)
  })