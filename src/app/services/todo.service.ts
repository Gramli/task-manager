import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TodoItem } from '../models/todo.model';
import { DBService } from './db.service';

export const TODO_STORE_NAME = 'todos';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private todos = new BehaviorSubject<TodoItem[]>([]);

  constructor(private dbService: DBService) {
    this.loadFromIndexedDB();
  }

  getTodos(): Observable<TodoItem[]> {
    return this.todos.asObservable();
  }

  private async loadFromIndexedDB(): Promise<void> {
    try {
      const db = await this.dbService.openDB();
      const tx = db.transaction(TODO_STORE_NAME, 'readonly');
      const store = tx.objectStore(TODO_STORE_NAME);
      const req = store.getAll();
      
      req.onsuccess = () => {
        let items = (req.result || []) as TodoItem[];
        
        // Migrate from localStorage if needed
        const stored = localStorage.getItem('todos');
        if (stored && items.length === 0) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              items = parsed.map((todo: any, index: number) => ({
                id: todo.id || Date.now().toString() + index,
                text: todo.text || '',
                completed: !!todo.completed,
                createdAt: new Date(todo.createdAt ?? Date.now()),
                order: index
              }));
              this.putAllToDB(items);
            }
            localStorage.removeItem('todos');
          } catch (e) {
            console.error('Failed to parse todos from localStorage', e);
          }
        }
        
        // Ensure sorting by order or createdAt, to preserve UI state
        items.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        // Assign orders if missing
        items.forEach((item, index) => {
          if (item.order === undefined) {
            item.order = index;
          }
        });

        this.todos.next(items);
      };
      
      req.onerror = () => {
        console.error('Failed to load todos from IndexedDB', req.error);
      };
    } catch (err) {
      console.error('IndexedDB open failed', err);
    }
  }

  private async putTodoToDB(todo: TodoItem): Promise<void> {
    const db = await this.dbService.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TODO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(TODO_STORE_NAME);
      const req = store.put(todo);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async putAllToDB(todos: TodoItem[]): Promise<void> {
    const db = await this.dbService.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TODO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(TODO_STORE_NAME);
      
      // Update the order locally and in the database
      todos.forEach((t, i) => t.order = i);

      for (const t of todos) {
        store.put(t);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async deleteTodoFromDB(todoId: string): Promise<void> {
    const db = await this.dbService.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TODO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(TODO_STORE_NAME);
      const req = store.delete(todoId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async addTodo(text: string): Promise<void> {
    const currentTodos = this.todos.value;
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date(),
      order: 0 // New items at the top
    };
    
    // Shift others' order
    const updatedTodos = [newTodo, ...currentTodos.map(t => ({...t, order: (t.order || 0) + 1}))];
    
    this.todos.next(updatedTodos);
    await this.putAllToDB(updatedTodos);
  }

  async toggleTodo(id: string): Promise<void> {
    const updated = this.todos.value.map(t => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    this.todos.next(updated);
    
    const toggled = updated.find(t => t.id === id);
    if (toggled) {
      await this.putTodoToDB(toggled);
    }
  }

  async editTodo(id: string, text: string): Promise<void> {
    const updated = this.todos.value.map(t => {
      if (t.id === id) {
        return { ...t, text };
      }
      return t;
    });
    this.todos.next(updated);

    const edited = updated.find(t => t.id === id);
    if (edited) {
      await this.putTodoToDB(edited);
    }
  }

  async deleteTodo(id: string): Promise<void> {
    const updated = this.todos.value.filter(t => t.id !== id);
    this.todos.next(updated);
    await this.deleteTodoFromDB(id);
  }

  async updateTodosOrder(todos: TodoItem[]): Promise<void> {
    this.todos.next(todos);
    await this.putAllToDB(todos);
  }
}
