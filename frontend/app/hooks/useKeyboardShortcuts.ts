import { useEffect } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import { useSocketStore } from "../stores/socketStore";

export function useKeyboardShortcuts() {
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const setTool = useCanvasStore((state) => state.setTool);
  const socket = useSocketStore((state) => state.socket);
  const roomId = useSocketStore((state) => state.roomId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Undo: Ctrl+Z (or Cmd+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const undoneAction = undo();

        if (undoneAction && socket && roomId) {
          socket.emit("draw:undo", { roomId, action: undoneAction });
        }
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z (or Cmd on Mac)
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        const redoneAction = redo();

        if (redoneAction && socket && roomId) {
          socket.emit("draw:action", { roomId, action: redoneAction });
        }
      }

      // Tool shortcuts
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setTool("pen");
      }

      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setTool("eraser");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo, setTool, socket, roomId]);
}
