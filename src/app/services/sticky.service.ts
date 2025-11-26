import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StickyNote } from '../models/sticky.model';
import { DBService } from './db.service';

export const STICKY_STORE_NAME = 'stickies';

@Injectable({ providedIn: 'root' })
export class StickyService {
  private notes$ = new BehaviorSubject<StickyNote[]>([]);

  constructor(private dbService: DBService) {
    this.loadFromIndexedDB();
  }

  getNotes(): Observable<StickyNote[]> {
    return this.notes$.asObservable();
  }

  private async loadFromIndexedDB(): Promise<void> {
    try {
      const db = await this.dbService.openDB();
      const tx = db.transaction(STICKY_STORE_NAME, 'readonly');
      const store = tx.objectStore(STICKY_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => this.notes$.next(req.result || []);
      req.onerror = () => console.error('Failed to load stickies', req.error);
    } catch (err) {
      console.error(err);
    }
  }

  private async putNoteToDB(note: StickyNote): Promise<void> {
    const db = await this.dbService.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STICKY_STORE_NAME, 'readwrite');
      const store = tx.objectStore(STICKY_STORE_NAME);
      const req = store.put(note);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async deleteNoteFromDB(id: string): Promise<void> {
    const db = await this.dbService.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STICKY_STORE_NAME, 'readwrite');
      const store = tx.objectStore(STICKY_STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async addNote(partial: Partial<StickyNote>): Promise<StickyNote> {
    const id = Date.now().toString();
    const now = Date.now();
    const note: StickyNote = {
      id,
      title: partial.title || '',
      content: partial.content || '',
      color: partial.color || 'steelBlue',
      x: partial.x ?? 50,
      y: partial.y ?? 50,
      width: partial.width || 220,
      height: partial.height || 200,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...this.notes$.value, note];
    this.notes$.next(updated);
    await this.putNoteToDB(note);
    return note;
  }

  async updateNote(updatedNote: StickyNote): Promise<void> {
    const updated = this.notes$.value.map(n => n.id === updatedNote.id ? { ...updatedNote, updatedAt: Date.now() } : n);
    this.notes$.next(updated);
    await this.putNoteToDB(updatedNote);
  }

  async deleteNote(id: string): Promise<void> {
    const updated = this.notes$.value.filter(n => n.id !== id);
    this.notes$.next(updated);
    await this.deleteNoteFromDB(id);
  }
}