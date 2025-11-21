import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StickyService } from '../../services/sticky.service';
import { StickyNote } from '../../models/sticky.model';
import { StickyNoteComponent } from '../sticky-note/sticky-note.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { firstValueFrom, Observable } from 'rxjs';

@Component({
  selector: 'app-sticky-dashboard',
  standalone: true,
  imports: [CommonModule, DragDropModule, StickyNoteComponent],
  templateUrl: './sticky-dashboard.component.html',
  styleUrls: ['./sticky-dashboard.component.scss'],
})
export class StickyDashboardComponent implements OnInit {
  notes$!: Observable<StickyNote[]>;
  colors: StickyNote['color'][] = [
    'darkKhaki',
    'paleVioletRed',
    'seaGreen',
    'steelBlue',
    'sandyBrown',
    'indianRed',
  ];

  constructor(private sticky: StickyService) {}

  ngOnInit(): void {
    this.notes$ = this.sticky.getNotes();
  }

  async createNote(color: StickyNote['color'] = 'steelBlue') {
    const notes = (await firstValueFrom(this.sticky.getNotes())) || [];
    let x = 100;
    let y = 80;
    if (notes.length) {
      const last = notes.reduce((a, b) => (a.createdAt || 0) > (b.createdAt || 0) ? a : b);
      x = (last.x ?? x) + 24;
      y = (last.y ?? y) + 24;
    }
    await this.sticky.addNote({ color, x, y, title: 'New note' });
  }

  async onUpdate(id: string, partial: Partial<StickyNote>) {
    const notes = (await firstValueFrom(this.sticky.getNotes())) || [];
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const merged = { ...target, ...partial, updatedAt: Date.now() };
    await this.sticky.updateNote(merged);
  }

  async onDelete(id: string) {
    await this.sticky.deleteNote(id);
  }
}
