const Queue = require('queue');

class TaskQueue {
    constructor(concurrency = 10) {
        this.queue = Queue({ concurrency, autostart: true });
        this.running = new Set();
    }

    addTask(taskFn, taskId) {
        return new Promise((resolve, reject) => {
            const wrappedTask = async () => {
                this.running.add(taskId);
                try {
                    const result = await taskFn();
                    this.running.delete(taskId);
                    resolve(result);
                    return result;
                } catch (error) {
                    this.running.delete(taskId);
                    reject(error);
                    throw error;
                }
            };
            this.queue.push(wrappedTask);
        });
    }

    isProcessing(taskId) {
        return this.running.has(taskId);
    }

    getQueueLength() {
        return this.queue.length;
    }

    getRunningTasks() {
        return Array.from(this.running);
    }
}

// 创建两个专门的队列实例
const tagQueue = new TaskQueue(10);
const colorQueue = new TaskQueue(10);

module.exports = {
    tagQueue,
    colorQueue
}; 