"use client";

import { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import { DrawAction } from "../types";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<[number, number][]>([]);

  const { tool, color, brushSize, actions, addAction } = useCanvasStore();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing properties
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // Redraw canvas when actions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Replay all actions
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

  const startDrawing = (x: number, y: number) => {
    setIsDrawing(true);
    setCurrentPath([[x, y]]);
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing) return;
    setCurrentPath((prev) => [...prev, [x, y]]);
  };

  const stopDrawing = () => {
    if (!isDrawing || currentPath.length === 0) return;

    const action: DrawAction = {
      type: "path",
      tool,
      color: tool === "eraser" ? "#FFFFFF" : color,
      width: tool === "eraser" ? brushSize * 2 : brushSize,
      points: currentPath,
    };

    addAction(action);
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
