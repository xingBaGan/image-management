import Queue from 'queue';
import { EventEmitter } from 'events';
import { notifyAllWindows } from '../utils/index.cjs';

interface QueueProgress {
  total: number;
  completed: number;
  percentage: number;
  running: number;
}

interface TaskStartEvent {
  taskId: string;
}

interface TaskCompleteEvent extends TaskStartEvent {
  success: boolean;
  error?: Error;
}

interface QueueProgressUpdate {
  type: string;
  progress: QueueProgress;
}

interface TaskStatusUpdate {
  type: string;
  status: 'start' | 'complete';
  taskId: string;
  success?: boolean;
  error?: Error;
}

class TaskQueue extends EventEmitter {
  private queue: Queue;
  private running: Set<string>;
  private total: number;
  private completed: number;

  constructor(concurrency = 10) {
    super();
    this.queue = Queue({ concurrency, autostart: true });
    this.running = new Set();
    this.total = 0;
    this.completed = 0;
  }

  addTask<T>(taskFn: () => Promise<T>, taskId: string): Promise<T> {
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

  private _emitProgress(): void {
    const progress = this.getProgress();
    this.emit('progress', progress);
  }

  isProcessing(taskId: string): boolean {
    return this.running.has(taskId);
  }

  getQueueLength(): number {
    return this.queue.length;
  }
  
  getTotalLength(): number {
    return this.total;
  }
  
  getCompletedLength(): number {
    return this.completed;
  }
  getRunningTasks(): string[] {
    return Array.from(this.running);
  }

  getRunningLength(): number {
    return this.running.size;
  }

  getProgress(): QueueProgress {
    return {
      total: this.getTotalLength(),
      completed: this.getCompletedLength(),
      percentage: this.getTotalLength() > 0 ? Math.round((this.getCompletedLength() / this.getTotalLength()) * 100) : 0,
      running: this.getRunningLength()
    };
  }

  reset(): void {
    this.total = 0;
    this.completed = 0;
    this._emitProgress();
  }

  cancelAllTasks(): void {
    this.queue.end();
    this.running.clear();
    setTimeout(() => {
      this.reset();
    }, 1000);
  }
}

// 创建两个专门的队列实例
const tagQueue = new TaskQueue(10);
const colorQueue = new TaskQueue(10);

// 设置事件监听器
function setupQueueListeners(queue: TaskQueue, name: string): void {
  queue.on('progress', (progress: QueueProgress) => {
    notifyAllWindows('queue-progress-update', {
      type: name,
      progress
    } as QueueProgressUpdate);
  }); 

  queue.on('taskStart', (data: TaskStartEvent) => {
    notifyAllWindows('task-status-update', {
      type: name,
      status: 'start',
      ...data
    } as TaskStatusUpdate);
  });

  queue.on('taskComplete', (data: TaskCompleteEvent) => {
    notifyAllWindows('task-status-update', {
      type: name,
      status: 'complete',
      ...data
    } as TaskStatusUpdate);
  });
}

setupQueueListeners(tagQueue, 'tag');
setupQueueListeners(colorQueue, 'color');

export {
  tagQueue,
  colorQueue,
  TaskQueue,
  QueueProgress,
  TaskStartEvent,
  TaskCompleteEvent,
  QueueProgressUpdate,
  TaskStatusUpdate
}; 