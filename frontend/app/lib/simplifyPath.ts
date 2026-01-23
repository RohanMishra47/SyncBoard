import simplify from "simplify-js";
import { DrawAction } from "../types";

export function simplifyDrawAction(action: DrawAction): DrawAction {
  if (action.type !== "path" || !action.points || action.points.length < 3) {
    return action;
  }

  // Convert to simplify-js format
  const points = action.points.map(([x, y]) => ({ x, y }));

  // Simplify the points
  const simplified = simplify(points, 2, true);

  // Convert back to [x, y] format
  const simplifiedPoints: [number, number][] = simplified.map((p) => [
    p.x,
    p.y,
  ]);

  return {
    ...action,
    points: simplifiedPoints,
  };
}
