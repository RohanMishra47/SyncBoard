export type Tool = "pen" | "eraser";

// Draw action type
export interface DrawAction {
  type: "path" | "clear";
  tool?: Tool;
  color?: string;
  width?: number;
  points?: [number, number][];
}

// User type
export interface User {
  id: string;
  name: string;
  createdAt: string;
}

// Canvas state type
export interface CanvasState {
  tool: Tool;
  color: string;
  brushSize: number;
}

// Room type
export interface Room {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy: User;
  canvasData: {
    actions: DrawAction[];
  } | null;
}

// Connected user type for socket management
export interface ConnectedUser {
  id: string;
  name: string;
  socketId: string;
  cursor?: {
    x: number;
    y: number;
  };
}
