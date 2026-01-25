import { DrawAction } from "../types";

export function exportCanvasToPNG(
  canvas: HTMLCanvasElement,
  filename: string = "syncboard-export.png",
) {
  try {
    // Create a temporary canvas with white background
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return false;

    // Fill with white background
    tempCtx.fillStyle = "#FFFFFF";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the original canvas on top
    tempCtx.drawImage(canvas, 0, 0);

    // Create download link
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

export function exportCanvasToSVG(
  canvas: HTMLCanvasElement,
  actions: DrawAction[],
  filename: string = "syncboard-export.svg",
) {
  try {
    const width = canvas.width;
    const height = canvas.height;

    // Deduplicate actions by ID - keep only the last occurrence of each unique ID
    const deduplicatedActions = new Map(
      actions.map((action) => [action.id, action]),
    );

    // Convert Map back to array
    const uniqueActions = Array.from(deduplicatedActions.values());

    // Create SVG header
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
    svg += `  <rect width="100%" height="100%" fill="white"/>\n`;

    // Convert actions to SVG paths
    uniqueActions.forEach((action) => {
      if (action.type === "path" && action.points && action.points.length > 1) {
        const pathData = action.points
          .map((point: [number, number], index: number) => {
            const [x, y] = point;
            return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
          })
          .join(" ");

        svg += `  <path d="${pathData}" stroke="${action.color || "#000000"}" stroke-width="${action.width || 3}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>\n`;
      }
    });

    svg += "</svg>";

    // Create blob and download
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
