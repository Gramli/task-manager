import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StickyNote } from '../../models/sticky.model';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sticky-note',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './sticky-note.component.html',
  styleUrls: ['./sticky-note.component.scss'],
})
export class StickyNoteComponent {
  @Input() note!: StickyNote;
  @Output() update = new EventEmitter<Partial<StickyNote>>();
  @Output() delete = new EventEmitter<string>();

  editing = false;

  emitUpdate(part: Partial<StickyNote>) {
    this.update.emit(part);
  }

  onDragEnded(e: any) {
    const delta = e.source.getFreeDragPosition ? e.source.getFreeDragPosition() : { x: 0, y: 0 };
    const newX = Math.round((this.note.x ?? 0) + (delta.x ?? 0));
    const newY = Math.round((this.note.y ?? 0) + (delta.y ?? 0));
    this.emitUpdate({ x: newX, y: newY });
    try { e.source.reset(); } catch {}
  }

  onTextAreaBlur(part: Partial<StickyNote>){
    this.editing = false;
    this.emitUpdate(part);
  }

  onDelete() {
    this.delete.emit(this.note.id);
  }
}