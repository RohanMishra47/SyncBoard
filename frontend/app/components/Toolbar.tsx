"use client";

import { Eraser, Pencil, Trash2 } from "lucide-react";
import { useCanvasStore } from "../stores/canvasStore";

export default function Toolbar() {
  const {
    tool,
    color,
    brushSize,
    setTool,
    setColor,
    setBrushSize,
    clearCanvas,
  } = useCanvasStore();

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="max-w-7xl mx-auto flex items-center gap-6">
        {/* Tool Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded ${
              tool === "pen"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title="Pen"
          >
            <Pencil size={20} />
          </button>

          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded ${
              tool === "eraser"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title="Eraser"
          >
            <Eraser size={20} />
          </button>
        </div>

        {/* Color Picker (only show when pen is selected) */}
        {tool === "pen" && (
          <div className="flex items-center gap-2">
            <label htmlFor="color-picker" className="text-sm text-gray-600">
              Color:
            </label>
            <input
              id="color-picker"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        )}

        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <label htmlFor="brush-size" className="text-sm text-gray-600">
            Size:
          </label>
          <input
            id="brush-size"
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-gray-600 w-6">{brushSize}</span>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearCanvas}
          className="ml-auto p-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
          title="Clear Canvas"
        >
          <Trash2 size={20} />
          Clear
        </button>
      </div>
    </div>
  );
}
