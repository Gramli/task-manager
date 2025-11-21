export interface StickyNote {
  id: string;
  title?: string;
  content?: string;
  color: 'darkKhaki' | 'paleVioletRed' | 'seaGreen' | 'steelBlue' | 'sandyBrown' | 'indianRed';
  x: number; // left px
  y: number; // top px
  width?: number;
  height?: number;
  createdAt: number;
  updatedAt?: number;
}