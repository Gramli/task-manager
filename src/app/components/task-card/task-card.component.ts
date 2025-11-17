import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent implements OnChanges, OnDestroy {
  @Input() task!: Task;

  displayTime = 0;
  private tickHandle: any = null;

  constructor(
    private taskService: TaskService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.task) {
      return;
    }
    this.updateDisplayTime();

    if (this.task.isTimerActive) {
      this.startLocalTicker();
    } else {
      this.stopLocalTicker();
    }
  }

  get showClearTimer(): boolean {
    if (!this.task) {
      return false;
    }
    return this.task.status === 'draft' && this.task.timeSpent > 0;
  }

  ngOnDestroy(): void {
    this.stopLocalTicker();
  }

  toggleTimer(): void {
    if (!this.task) {
      return;
    }
    if (this.task.status === 'done' || this.task.status === 'draft') {
      return;
    }

    if (this.task.isTimerActive) {
      this.taskService.stopTimer(this.task.id);
    } else {
      this.taskService.startTimer(this.task.id);
    }
    this.updateDisplayTime();
  }

  private updateDisplayTime(): void {
    const base = this.task?.timeSpent || 0;
    if (this.task?.isTimerActive && this.task.startedAt) {
      const elapsed = Math.floor((Date.now() - this.task.startedAt) / 1000);
      this.displayTime = base + elapsed;
    } else {
      this.displayTime = base;
    }
  }

  private startLocalTicker(): void {
    if (this.tickHandle) {
      return;
    }
    this.tickHandle = setInterval(() => {
      this.updateDisplayTime();
      this.cd.markForCheck();
    }, 1000);
  }

  private stopLocalTicker(): void {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
    if (this.task) {
      this.updateDisplayTime();
      this.cd.markForCheck();
    }
  }

  formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const parts: string[] = [];
    if (hrs) {
      parts.push(`${hrs}h`);
    }
    if (mins || hrs) {
      parts.push(`${mins}m`);
    }
    parts.push(`${secs}s`);
    return parts.join(' ');
  }

  async deleteTask(): Promise<void> {
    if (!this.task) {
      return;
    }
    if (this.task.isTimerActive) {
      await this.taskService.stopTimer(this.task.id);
    }
    await this.taskService.deleteTask(this.task.id);
  }

  async clearTimer(): Promise<void> {
    if (!this.task) {
      return;
    }
    await this.taskService.clearTimer(this.task.id);
  }
}
