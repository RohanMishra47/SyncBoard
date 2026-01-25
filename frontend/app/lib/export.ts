import simplify from "simplify-js";
import { DrawAction } from "../types";

export function exportCanvasToSVG(
  canvas: HTMLCanvasElement,
  actions: DrawAction[],
  filename: string = "syncboard-export.svg",
) {
  try {
    // 1. Handle "Clear" history
    const lastClearIndex = actions.map((a) => a.type).lastIndexOf("clear");
    const activeActions =
      lastClearIndex === -1 ? actions : actions.slice(lastClearIndex + 1);

    // 2. Deduplicate by ID
    const actionMap = new Map<string, DrawAction>();
    activeActions.forEach((action) => {
      actionMap.set(action.id, action);
    });

    // 3. Filter valid actions
    const validActions = Array.from(actionMap.values()).filter((action) => {
      return (
        action.type === "path" && action.points && action.points.length >= 1
      );
    });

    // 4. Calculate Bounding Box
    let minX = 0;
    let minY = 0;
    let maxX = canvas.width;
    let maxY = canvas.height;

    // We only need to check points if we have valid actions
    if (validActions.length > 0) {
      // Initialize bounding box to first point
      const firstPoint = validActions[0].points![0];
      minX = firstPoint[0];
      minY = firstPoint[1];
      maxX = firstPoint[0];
      maxY = firstPoint[1];

      // Technique to find cornermost points
      validActions.forEach((action) => {
        action.points!.forEach(([x, y]) => {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        });
      });
    }

    const padding = 10;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = maxX - minX;
    const height = maxY - minY;

    // 5. Generate SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">\n`;
    svg += `  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="white"/>\n`;

    validActions.forEach((action) => {
      if (!action.points || action.points.length === 0) return;

      const strokeColor = action.color || "#000000";
      const strokeWidth = action.width || 3;

      // Handle Dots
      if (action.points.length === 1) {
        const [x, y] = action.points[0];
        const r = strokeWidth / 2;
        svg += `  <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r}" fill="${strokeColor}" />\n`;
      }
      // Handle Paths
      else {
        // Convert [x,y] tuples to {x,y} objects for simplify-js
        const pointsObject = action.points.map(([x, y]) => ({ x, y }));

        // Optimize: tolerance 0.5, highQuality true
        const simplifiedPoints = simplify(pointsObject, 0.5, true);

        const pathData = simplifiedPoints
          .map((point, idx) => {
            return idx === 0
              ? `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
              : `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
          })
          .join(" ");

        if (pathData.length > 0) {
          svg += `  <path d="${pathData}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>\n`;
        }
      }
    });

    svg += "</svg>";

    // Download
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("SVG export failed:", error);
    return false;
  }
}

// Export canvas to PNG with white background
export function exportCanvasToPNG(
  canvas: HTMLCanvasElement,
  filename: string = "syncboard-export.png",
) {
  try {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return false;

    tempCtx.fillStyle = "#FFFFFF";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = filename;
    link.href = tempCanvas.toDataURL("image/png");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error("PNG export failed:", error);
    return false;
  }
}
