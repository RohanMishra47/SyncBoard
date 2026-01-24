import { DrawAction } from "../types";

export function exportCanvasToPNG(
  canvas: HTMLCanvasElement,
  filename: string = "syncboard-export.png",
) {
  try {
    // Create a temporary link element
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");

    // Trigger download
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

    // Create SVG header
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
    svg += `  <rect width="100%" height="100%" fill="white"/>\n`;

    // Convert actions to SVG paths
    actions.forEach((action) => {
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
