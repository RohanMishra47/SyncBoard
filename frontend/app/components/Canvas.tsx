"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { useCanvasStore } from "../stores/canvasStore";
import { DrawAction } from "../types";

interface CanvasProps {
  socket: Socket | null;
  roomId: string;
}

export default function Canvas({ socket, roomId }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<[number, number][]>([]);

  const { tool, color, brushSize, actions, addAction } = useCanvasStore();

  // Function to redraw the entire canvas based on actions
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    actions.forEach((action) => {
      if (action.type === "clear") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else if (
        action.type === "path" &&
        action.points &&
        action.points.length > 0
      ) {
        ctx.strokeStyle = action.color || "#000000";
        ctx.lineWidth = action.width || 3;

        ctx.beginPath();
        ctx.moveTo(action.points[0][0], action.points[0][1]);

        action.points.forEach(([x, y]) => {
          ctx.lineTo(x, y);
        });

        ctx.stroke();
      }
    });
  }, [actions]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [redrawCanvas]);

  // Redraw canvas when actions change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Draw the current path in real-time
  const drawCurrentPath = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (currentPath.length < 2) return;

    ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
    ctx.lineWidth = tool === "eraser" ? brushSize * 2 : brushSize;

    ctx.beginPath();
    ctx.moveTo(currentPath[0][0], currentPath[0][1]);

    currentPath.forEach(([x, y]) => {
      ctx.lineTo(x, y);
    });

    ctx.stroke();
  }, [currentPath, tool, color, brushSize]);

  // Update drawing on currentPath change
  useEffect(() => {
    if (isDrawing && currentPath.length > 0) {
      redrawCanvas(); // First redraw everything
      drawCurrentPath(); // Then draw the current path on top
    }
  }, [isDrawing, currentPath, redrawCanvas, drawCurrentPath]);

  // Drawing handlers
  const startDrawing = (x: number, y: number) => {
    setIsDrawing(true);
    setCurrentPath([[x, y]]);
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing) return;

    const newPath = [...currentPath, [x, y] as [number, number]];
    setCurrentPath(newPath);

    // Emit incremental update while drawing
    if (socket && roomId && newPath.length % 3 === 0) {
      // Throttle: only emit every 3rd point to reduce network load
      const incrementalAction: DrawAction = {
        type: "path",
        tool,
        color: tool === "eraser" ? "#FFFFFF" : color,
        width: tool === "eraser" ? brushSize * 2 : brushSize,
        points: newPath,
      };

      socket.emit("draw:action", { roomId, action: incrementalAction });
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || currentPath.length === 0) {
      setIsDrawing(false);
      return;
    }

    const action: DrawAction = {
      type: "path",
      tool,
      color: tool === "eraser" ? "#FFFFFF" : color,
      width: tool === "eraser" ? brushSize * 2 : brushSize,
      points: currentPath,
    };

    // Add to local state
    addAction(action);

    // Emit to other users via socket
    if (socket && socket.connected && roomId) {
      console.log("📤 Emitting draw action to room:", roomId);
      socket.emit("draw:action", { roomId, action });
    } else {
      console.warn("⚠️ Socket not connected, cannot emit action");
    }

    setIsDrawing(false);
    setCurrentPath([]);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    startDrawing(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    draw(e.clientX - rect.left, e.clientY - rect.top);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    draw(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-white cursor-crosshair touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={stopDrawing}
    />
  );
}
