const Queue = require('queue');
const EventEmitter = require('events');
// 生成哈希ID
const { notifyAllWindows } = require('../utils/index.cjs');


class TaskQueue extends EventEmitter {
    constructor(concurrency = 10) {
        super();
        this.queue = Queue({ concurrency, autostart: true });
        this.running = new Set();
        this.total = 0;
        this.completed = 0;
    }

    addTask(taskFn, taskId) {
        this.total += 1;
        this._emitProgress();
        
        return new Promise((resolve, reject) => {
            const wrappedTask = async () => {
                this.running.add(taskId);
                this.emit('taskStart', { taskId });
                
                try {
                    const result = await taskFn();
                    this.running.delete(taskId);
                    this.completed += 1;
                    this._emitProgress();
                    this.emit('taskComplete', { taskId, success: true });
                    resolve(result);
                    return result;
                } catch (error) {
                    this.running.delete(taskId);
                    this.completed += 1;
                    this._emitProgress();
                    this.emit('taskComplete', { taskId, success: false, error });
                    reject(error);
                    throw error;
                }
            };
            this.queue.push(wrappedTask);
        });
    }

    _emitProgress() {
        const progress = this.getProgress();
        this.emit('progress', progress);
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

    getProgress() {
        return {
            total: this.total,
            completed: this.completed,
            percentage: this.total > 0 ? Math.round((this.completed / this.total) * 100) : 0,
            running: this.running.size
        };
    }

    reset() {
        this.total = 0;
        this.completed = 0;
        this._emitProgress();
    }
}

// 创建两个专门的队列实例
const tagQueue = new TaskQueue(10);
const colorQueue = new TaskQueue(10);

// 设置事件监听器
function setupQueueListeners(queue, name) {
    queue.on('progress', (progress) => {
        notifyAllWindows('queue-progress-update', {
            type: name,
            progress
        });
    }); 

    queue.on('taskStart', (data) => {
        notifyAllWindows('task-status-update', {
            type: name,
            status: 'start',
            ...data
        });
    });

    queue.on('taskComplete', (data) => {
        notifyAllWindows('task-status-update', {
            type: name,
            status: 'complete',
            ...data
        });
    });
}

setupQueueListeners(tagQueue, 'tag');
setupQueueListeners(colorQueue, 'color');

module.exports = {
    tagQueue,
    colorQueue
}; 