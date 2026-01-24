"use client";

import {
  Download,
  Eraser,
  Pencil,
  Redo2,
  Trash2,
  Undo2,
  Wifi,
  WifiOff,
} from "lucide-react";
import React from "react";
import { exportCanvasToPNG, exportCanvasToSVG } from "../lib/export";
import { useCanvasStore } from "../stores/canvasStore";
import { useRoomStore } from "../stores/roomStore";
import { useSocketStore } from "../stores/socketStore";

interface ToolbarProps {
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export default function Toolbar({ canvasRef }: ToolbarProps) {
  const room = useRoomStore((state) => state.room);
  const actions = useCanvasStore((state) => state.actions);
  const tool = useCanvasStore((state) => state.tool);
  const color = useCanvasStore((state) => state.color);
  const brushSize = useCanvasStore((state) => state.brushSize);
  const isConnected = useCanvasStore((state) => state.isConnected);
  const setTool = useCanvasStore((state) => state.setTool);
  const setColor = useCanvasStore((state) => state.setColor);
  const setBrushSize = useCanvasStore((state) => state.setBrushSize);
  const clearCanvas = useCanvasStore((state) => state.clearCanvas);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) => state.canUndo());
  const canRedo = useCanvasStore((state) => state.canRedo());

  const { socket, roomId } = useSocketStore();

  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const handleClearCanvas = () => {
    clearCanvas();

    if (socket && roomId) {
      const clearAction =
        useCanvasStore.getState().actions[
          useCanvasStore.getState().actions.length - 1
        ];

      socket.emit("draw:action", {
        roomId,
        action: clearAction, // Send the full action with ID
      });
    }
  };

  const handleUndo = () => {
    const undoneAction = undo();

    if (undoneAction && socket && roomId) {
      // Emit undo event to server
      socket.emit("draw:undo", { roomId, action: undoneAction });
    }
  };

  const handleRedo = () => {
    const redoneAction = redo();

    if (redoneAction && socket && roomId) {
      // Emit the redone action as a new draw action
      socket.emit("draw:action", { roomId, action: redoneAction });
    }
  };

  const handleExportPNG = () => {
    if (canvasRef?.current) {
      const filename = `${room?.name || "syncboard"}-${Date.now()}.png`;
      exportCanvasToPNG(canvasRef.current, filename);
      setShowExportMenu(false);
    }
  };

  const handleExportSVG = () => {
    if (canvasRef?.current) {
      const filename = `${room?.name || "syncboard"}-${Date.now()}.svg`;
      exportCanvasToSVG(canvasRef.current, actions, filename);
      setShowExportMenu(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="max-w-7xl mx-auto flex items-center gap-6">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi size={20} className="text-green-500" />
              <span className="text-sm text-green-600">Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={20} className="text-red-500" />
              <span className="text-sm text-red-600">Disconnected</span>
            </>
          )}
        </div>

        {/* Tool Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded ${
              tool === "pen"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title="Pen (P)"
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
            title="Eraser (E)"
          >
            <Eraser size={20} />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-2 rounded ${
              canUndo
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-gray-50 text-gray-400 cursor-not-allowed"
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={20} />
          </button>

          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-2 rounded ${
              canRedo
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-gray-50 text-gray-400 cursor-not-allowed"
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={20} />
          </button>
        </div>

        {/* Color Picker */}
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

        <div className="ml-auto flex gap-2">
          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
              title="Export Canvas"
            >
              <Download size={20} />
              Export
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                <button
                  onClick={handleExportPNG}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700"
                >
                  Export as PNG
                </button>
                <button
                  onClick={handleExportSVG}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700"
                >
                  Export as SVG
                </button>
              </div>
            )}
          </div>

          {/* Clear Button */}
          <button
            onClick={handleClearCanvas}
            className="p-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
            title="Clear Canvas"
          >
            <Trash2 size={20} />
            Clear
          </button>
        </div>
      </div>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
}
