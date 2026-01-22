"use client";

import { throttle } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import { useSocketStore } from "../stores/socketStore";
import { useUserStore } from "../stores/userStore";
import { DrawAction } from "../types";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<[number, number][]>([]);
  const currentActionId = useRef<string | null>(null);

  const actions = useCanvasStore((state) => state.actions);
  const tool = useCanvasStore((state) => state.tool);
  const color = useCanvasStore((state) => state.color);
  const brushSize = useCanvasStore((state) => state.brushSize);
  const addAction = useCanvasStore((state) => state.addAction);
  const { socket, roomId } = useSocketStore();

  // Throttled draw action emission (max 60 updates/sec = 16ms)
  const emitDrawAction = useRef(
    throttle((action: DrawAction) => {
      if (socket && roomId) {
        socket.emit("draw:action", { roomId, action });
      }
    }, 16),
  ).current;

  // Throttled cursor move emission (max 20 updates/sec = 50ms)
  const emitCursorMove = useRef(
    throttle((x: number, y: number) => {
      const user = useUserStore.getState().user;
      if (socket && roomId && user) {
        socket.emit("cursor:move", {
          roomId,
          userId: user.id,
          position: { x, y },
        });
      }
    }, 50),
  ).current;

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

    // Generate ID when drawing starts
    const user = useUserStore.getState().user;
    currentActionId.current = `${user?.id || "unknown"}-${Date.now()}-${Math.random()}`;
  };
  const draw = (x: number, y: number) => {
    if (!isDrawing) return;

    const newPath = [...currentPath, [x, y] as [number, number]];
    setCurrentPath(newPath);

    // Emit incremental update with the SAME ID
    if (socket && roomId && newPath.length % 3 === 0) {
      const incrementalAction: DrawAction = {
        id: currentActionId.current!, // Use the same ID
        type: "path",
        tool,
        color: tool === "eraser" ? "#FFFFFF" : color,
        width: tool === "eraser" ? brushSize * 2 : brushSize,
        points: newPath,
        userId: useUserStore.getState().user?.id,
        timestamp: Date.now(),
      };

      emitDrawAction(incrementalAction);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || currentPath.length === 0) {
      setIsDrawing(false);
      currentActionId.current = null; // Clear the ID
      return;
    }

    const action: DrawAction = {
      id: currentActionId.current!, // Use the SAME ID as incremental updates
      type: "path",
      tool,
      color: tool === "eraser" ? "#FFFFFF" : color,
      width: tool === "eraser" ? brushSize * 2 : brushSize,
      points: currentPath,
      userId: useUserStore.getState().user?.id,
      timestamp: Date.now(),
    };

    addAction(action);

    if (socket && socket.connected && roomId) {
      socket.emit("draw:action", { roomId, action });
    }

    setIsDrawing(false);
    setCurrentPath([]);
    currentActionId.current = null; // Clear the ID
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    draw(x, y);
    emitCursorMove(x, y);
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
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    draw(x, y);
    emitCursorMove(x, y);
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
