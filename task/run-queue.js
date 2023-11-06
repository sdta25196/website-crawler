
import { run } from "../src/index.js"

/** 队列多任务抓目录 */

let list = ['https://www.baidu.com/abc']

class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }
}

// 创建一个长度为100的队列
const queue = new Queue();
for (let i = 1; i <= list.length; i++) {
  queue.enqueue(list[i]);
}
console.log(queue.size())

// 并发执行前十个任务
async function processQueue() {
  const tasks = [];

  // 取出前十个任务
  for (let i = 0; i < 2; i++) {
    const task = queue.dequeue();
    const { origin, href } = new URL(task)
    tasks.push(run({
      origin: origin,
      startHref: href,
      saveDataFolderName: 'creditsailing', // ! 保存文件的目录
      savePathname: pathname, // ! 指定的抓取目录, 不传就不分目录
      useProxy: true,
      callback: nextTask
    }));
  }
  const nextTask = async () => {
    while (!queue.isEmpty()) {
      const task = queue.dequeue();

      const { origin, href } = new URL(task)

      await run({
        origin: origin,
        startHref: href,
        saveDataFolderName: 'creditsailing', // ! 保存文件的目录
        savePathname: pathname, // ! 指定的抓取目录, 不传就不分目录
        useProxy: true,
        callback: nextTask
      })
    }
  }

  // 并发执行前十个任务
  await Promise.all(tasks);
}

// 启动程序
processQueue()
  .then(() => {
    console.log("所有任务已完成");
  })
  .catch((error) => {
    console.error("程序出错:", error);
  });