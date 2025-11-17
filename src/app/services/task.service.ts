import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../models/task.model';

const DB_NAME = 'task-manager-db';
const STORE_NAME = 'tasks';
const DB_VERSION = 1;

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private tasks = new BehaviorSubject<Task[]>([]);

  constructor() {
    this.loadFromIndexedDB();
  }

  getTasks(): Observable<Task[]> {
    return this.tasks.asObservable();
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async loadFromIndexedDB(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result || []) as Task[];
        this.tasks.next(items);
      };
      req.onerror = () => {
        console.error('Failed to load tasks from IndexedDB', req.error);
      };
    } catch (err) {
      console.error('IndexedDB open failed', err);
    }
  }

  private async putTaskToDB(task: Task): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(task);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async putAllToDB(tasks: Task[]): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const t of tasks) {
        store.put(t);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  addTask(title: string, description: string): Promise<void> {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      status: 'draft',
      timeSpent: 0,
      isTimerActive: false,
      createdAt: new Date(),
    };
    const updated = [...this.tasks.value, newTask];
    this.tasks.next(updated);
    return this.putTaskToDB(newTask);
  }

  async updateTaskStatus(
    taskId: string,
    newStatus: 'draft' | 'inProgress' | 'done'
  ): Promise<void> {
    const updated = this.tasks.value.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    this.tasks.next(updated);
    await this.putAllToDB(updated);
  }

  async startTimer(taskId: string): Promise<void> {
    const updated = this.tasks.value.map((t) => {
      if (t.id === taskId && !t.isTimerActive) {
        return { ...t, isTimerActive: true, startedAt: Date.now() };
      }
      return t;
    });
    this.tasks.next(updated);
    await this.putAllToDB(updated);
  }

  async stopTimer(taskId: string): Promise<void> {
    const now = Date.now();
    const updated = this.tasks.value.map((t) => {
      if (t.id === taskId && t.isTimerActive) {
        const elapsed = t.startedAt
          ? Math.floor((now - t.startedAt) / 1000)
          : 0;
        return {
          ...t,
          isTimerActive: false,
          startedAt: undefined,
          timeSpent: (t.timeSpent || 0) + elapsed,
        };
      }
      return t;
    });
    this.tasks.next(updated);
    await this.putAllToDB(updated);
  }

  async clearTimer(taskId: string): Promise<void> {
    const updated = this.tasks.value.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          isTimerActive: false,
          startedAt: undefined,
          timeSpent: 0,
        };
      }
      return t;
    });
    this.tasks.next(updated);
    await this.putAllToDB(updated);
  }

  private async deleteTaskFromDB(taskId: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(taskId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    const updated = this.tasks.value.filter((t) => t.id !== taskId);
    this.tasks.next(updated);
    await this.deleteTaskFromDB(taskId);
  }
}
