export type Tool = "pen" | "eraser";

export interface DrawAction {
  type: "path" | "clear";
  tool?: Tool;
  color?: string;
  width?: number;
  points?: [number, number][];
}

export interface User {
  id: string;
  name: string;
  createdAt: string;
}

export interface CanvasState {
  tool: Tool;
  color: string;
  brushSize: number;
}
