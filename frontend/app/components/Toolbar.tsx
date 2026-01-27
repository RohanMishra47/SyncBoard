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
    <>
      {/* Fixed Bottom Toolbar - Desktop & Tablet */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 hidden md:block">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
              {isConnected ? (
                <>
                  <Wifi size={18} className="text-green-500" />
                  <span className="text-xs font-medium text-green-600">
                    Live
                  </span>
                </>
              ) : (
                <>
                  <WifiOff size={18} className="text-red-500" />
                  <span className="text-xs font-medium text-red-600">
                    Offline
                  </span>
                </>
              )}
            </div>

            {/* Tool Selection */}
            <div className="flex gap-2">
              <button
                onClick={() => setTool("pen")}
                className={`p-2 rounded-lg transition-all ${
                  tool === "pen"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title="Pen (P)"
              >
                <Pencil size={18} />
              </button>

              <button
                onClick={() => setTool("eraser")}
                className={`p-2 rounded-lg transition-all ${
                  tool === "eraser"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title="Eraser (E)"
              >
                <Eraser size={18} />
              </button>
            </div>

            {/* Undo/Redo */}
            <div className="flex gap-2 pl-4 border-l border-slate-200">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`p-2 rounded-lg transition-all ${
                  canUndo
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-slate-50 text-slate-400 cursor-not-allowed"
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={18} />
              </button>

              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className={`p-2 rounded-lg transition-all ${
                  canRedo
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-slate-50 text-slate-400 cursor-not-allowed"
                }`}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={18} />
              </button>
            </div>

            {/* Color Picker */}
            {tool === "pen" && (
              <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                <label
                  htmlFor="color-picker"
                  className="text-xs font-medium text-slate-600"
                >
                  Color:
                </label>
                <input
                  id="color-picker"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300"
                />
              </div>
            )}

            {/* Brush Size */}
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
              <label
                htmlFor="brush-size"
                className="text-xs font-medium text-slate-600"
              >
                Size:
              </label>
              <input
                id="brush-size"
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-xs font-semibold text-slate-600 w-5">
                {brushSize}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pl-4 border-l border-slate-200">
              {/* Export Button */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
                  title="Export Canvas"
                >
                  <Download size={18} />
                  <span className="text-xs font-semibold">Export</span>
                </button>

                {showExportMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                    <button
                      onClick={handleExportPNG}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 text-slate-700"
                    >
                      Export as PNG
                    </button>
                    <button
                      onClick={handleExportSVG}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 text-slate-700"
                    >
                      Export as SVG
                    </button>
                  </div>
                )}
              </div>

              {/* Clear Button */}
              <button
                onClick={handleClearCanvas}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center gap-2"
                title="Clear Canvas"
              >
                <Trash2 size={18} />
                <span className="text-xs font-semibold">Clear</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Toolbar - Mobile */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 md:hidden max-w-[95vw]">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 px-3 py-2">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Connection Status */}
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi size={16} className="text-green-500" />
              ) : (
                <WifiOff size={16} className="text-red-500" />
              )}
            </div>

            {/* Tool Selection */}
            <button
              onClick={() => setTool("pen")}
              className={`p-2 rounded-lg transition-all ${
                tool === "pen"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-slate-100 text-slate-700"
              }`}
              title="Pen"
            >
              <Pencil size={18} />
            </button>

            <button
              onClick={() => setTool("eraser")}
              className={`p-2 rounded-lg transition-all ${
                tool === "eraser"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-slate-100 text-slate-700"
              }`}
              title="Eraser"
            >
              <Eraser size={18} />
            </button>

            {/* Undo/Redo */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-2 rounded-lg transition-all ${
                canUndo
                  ? "bg-slate-100 text-slate-700"
                  : "bg-slate-50 text-slate-400"
              }`}
            >
              <Undo2 size={18} />
            </button>

            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-2 rounded-lg transition-all ${
                canRedo
                  ? "bg-slate-100 text-slate-700"
                  : "bg-slate-50 text-slate-400"
              }`}
            >
              <Redo2 size={18} />
            </button>

            {/* Color Picker (only for pen) */}
            {tool === "pen" && (
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
              />
            )}

            {/* Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 bg-green-500 text-white rounded-lg"
              >
                <Download size={18} />
              </button>

              {showExportMenu && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                  <button
                    onClick={handleExportPNG}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 text-slate-700"
                  >
                    Export as PNG
                  </button>
                  <button
                    onClick={handleExportSVG}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 text-slate-700"
                  >
                    Export as SVG
                  </button>
                </div>
              )}
            </div>

            {/* Clear */}
            <button
              onClick={handleClearCanvas}
              className="p-2 bg-red-500 text-white rounded-lg"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Brush Size Slider - Second Row on Mobile */}
          <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-200">
            <span className="text-xs font-medium text-slate-600">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="flex-1 max-w-45"
            />
            <span className="text-xs font-semibold text-slate-600 w-5">
              {brushSize}
            </span>
          </div>
        </div>
      </div>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </>
  );
}
