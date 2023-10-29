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
for (let i = 1; i <= 100; i++) {
  queue.enqueue(`任务${i}`);
}
console.log(queue.size())

// 异步任务
function asyncTask(task,callback) {
  return new Promise((resolve, reject) => {
    // 模拟异步操作，这里使用setTimeout延迟1秒钟
    setTimeout(async () => {
      console.log(`完成任务: ${task}`);
        if(callback){await callback()}
      resolve();
    }, Math.floor(Math.random()*10+3)*1000);
  });
}

// 并发执行前十个任务
async function processQueue() {
  const tasks = [];

  // 取出前十个任务
  for (let i = 0; i < 10; i++) {
    const task = queue.dequeue();
    tasks.push(asyncTask(task,async ()=>{
      while (!queue.isEmpty()) {
        await asyncTask(queue.dequeue());
      }
    }));
  }

  // 并发执行前十个任务
  await Promise.all(tasks);

  // 当队列不为空时，继续取出任务并并发执行
  // while (!queue.isEmpty()) {
  //   const task = queue.dequeue();
  //   // tasks.push(asyncTask(task));
  //   await asyncTask(task);
  // }
}

// 启动程序
processQueue()
  .then(() => {
    console.log("所有任务已完成");
  })
  .catch((error) => {
    console.error("程序出错:", error);
  });