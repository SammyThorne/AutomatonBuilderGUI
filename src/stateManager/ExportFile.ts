import Konva from "konva";
import TransitionWrapper from "../TransitionWrapper";

/** Everything the export needs from StateManager, supplied by the caller. */
export interface ExportContext {
  stage: Konva.Stage | null;
  gridLayer: Konva.Layer | null;
  nodeLayer: Konva.Layer | null;
  transitionLayer: Konva.Layer | null;
  transitions: TransitionWrapper[];
  bounds: { x: number; y: number; width: number; height: number };
  useDarkMode: boolean;
}

export function exportAutomatonToImage(ctx: ExportContext) {
  const { stage, gridLayer, nodeLayer, transitionLayer, bounds } = ctx;
  if (!stage || !gridLayer || !nodeLayer || !transitionLayer) {
    console.error("error: stage or layers are not initialized");
    return;
  }
  const originalScale = stage.scale();
  const originalPosition = stage.position();

  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.batchDraw();

  ctx.transitions.forEach((transition) => {
    transition.updatePoints();
    if (!transition.konvaGroup.getParent()) {
      transitionLayer.add(transition.konvaGroup);
    }
  });

  gridLayer.batchDraw();
  nodeLayer.batchDraw();
  transitionLayer.batchDraw();

  // Set background based on dark/light mode.
  const background: Konva.Rect = new Konva.Rect({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    fill: ctx.useDarkMode ? "black" : "white",
    listening: false,
  });

  gridLayer.add(background);
  gridLayer.moveToBottom();
  gridLayer.batchDraw();

  const dataURL = stage.toDataURL({
    mimeType: "image/png",
    pixelRatio: 2,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  });

  background.destroy();
  gridLayer.batchDraw();

  stage.scale(originalScale);
  stage.position(originalPosition);
  stage.batchDraw();

  const downloadLink = document.createElement("a");
  downloadLink.href = dataURL;
  downloadLink.download = "diagram.png";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
