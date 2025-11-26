import { Injectable } from '@angular/core';
import { STICKY_STORE_NAME } from './sticky.service';
import { TASK_STORE_NAME } from './task.service';

@Injectable({ providedIn: 'root' })
export class DBService {
  private readonly DB_NAME = 'task-manager-db';
  private readonly DB_VERSION = 3;
  private initPromise?: Promise<void>;
  private cachedDb?: IDBDatabase;
  private requiredStores: string[] = [TASK_STORE_NAME, STICKY_STORE_NAME];

  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.openDBAndCreateStores(this.requiredStores).then(
      (db) => {
        this.cachedDb = db;
      }
    );
    return this.initPromise;
  }

  openDB(): Promise<IDBDatabase> {
    if (this.cachedDb) {
      return Promise.resolve(this.cachedDb);
    }
    else if (this.initPromise) {
      return this.initPromise.then(() => {
        if (!this.cachedDb) {
          throw new Error('Database failed to initialize.');
        }
        return this.cachedDb;
      });
    }

    throw new Error('Database not initialized. Call init() first.');
  }

  private openDBAndCreateStores(
    requiredStores: string[]
  ): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of requiredStores) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' });
          }
        }
      };

      req.onsuccess = () => {
        const db = req.result;
        const missing = requiredStores.filter(
          (n) => !db.objectStoreNames.contains(n)
        );
        if (missing.length) {
          db.close();
          reject(
            new Error(
              `Missing object stores after open: ${missing.join(
                ', '
              )}. Provide migration or clear DB.`
            )
          );
          return;
        }
        resolve(db);
      };

      req.onerror = () => reject(req.error);
    });
  }
}
