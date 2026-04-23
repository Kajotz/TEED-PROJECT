import { useEffect, useRef } from "react";

export default function HeroLiquidCanvas() {
  const canvasRef = useRef(null);
  const animationRef = useRef(0);
  const offscreenRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d", { alpha: true });
    if (!offCtx) return;

    offscreenRef.current = { canvas: offscreen, ctx: offCtx };

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const mix = (a, b, t) => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = true;

      const scale = 0.28;
      offscreen.width = Math.max(1, Math.floor(width * scale));
      offscreen.height = Math.max(1, Math.floor(height * scale));
      offCtx.imageSmoothingEnabled = true;
    };

    const render = (time) => {
      const buffer = offscreenRef.current;
      if (!buffer) return;

      const { canvas: bufferCanvas, ctx: bufferCtx } = buffer;
      const w = bufferCanvas.width;
      const h = bufferCanvas.height;

      const image = bufferCtx.createImageData(w, h);
      const data = image.data;

      const t = time * 0.00045;

      const blue = [31, 117, 254];
      const lightBlue = [123, 185, 255];
      const purple = [126, 84, 216];
      const magenta = [196, 76, 178];
      const orange = [255, 165, 0]; // #FFA500

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;

          const nx = x / w;
          const ny = y / h;

          const cx = nx - 0.5;
          const cy = ny - 0.5;

          let sx = cx * 1.8;
          let sy = cy * 0.95;

          const flow1 = Math.sin(sx * 3.2 - t * 1.2);
          const flow2 = Math.sin((sx + sy) * 2.4 + t * 0.9);
          const flow3 = Math.cos((sx - sy * 1.3) * 2.8 - t * 0.7);

          sx += flow2 * 0.18 + flow3 * 0.08;
          sy += flow1 * 0.10 + flow2 * 0.06;

          let phase =
            0.52 * Math.sin(sx * 4.6 - t) +
            0.28 * Math.sin((sx + sy * 0.8) * 3.9 + t * 0.8) +
            0.20 * Math.cos((sx - sy * 1.15) * 4.2 - t * 0.65);

          phase = (phase + 1) * 0.5;
          phase = clamp(phase, 0, 1);

          let color;

          // blue -> light blue -> purple -> magenta -> orange -> magenta -> purple -> blue
          // orange band reduced so warm side stops shouting
          if (phase < 0.15) {
            color = mix(blue, lightBlue, phase / 0.15);
          } else if (phase < 0.34) {
            color = mix(lightBlue, purple, (phase - 0.15) / 0.19);
          } else if (phase < 0.50) {
            color = mix(purple, magenta, (phase - 0.34) / 0.16);
          } else if (phase < 0.59) {
            color = mix(magenta, orange, (phase - 0.50) / 0.09);
          } else if (phase < 0.68) {
            color = mix(orange, magenta, (phase - 0.59) / 0.09);
          } else if (phase < 0.84) {
            color = mix(magenta, purple, (phase - 0.68) / 0.16);
          } else {
            color = mix(purple, blue, (phase - 0.84) / 0.16);
          }

          const dist = Math.sqrt(cx * cx + cy * cy);
          const depth = Math.max(0.8, 1.02 - dist * 0.45);

          const ribbon = Math.abs(
            Math.sin(sx * 5.8 - t * 0.7) * Math.cos(sy * 4.6 + t * 0.45)
          );

          const highlight = Math.pow(ribbon, 8) * 0.08;

          const r = clamp(color[0] * depth + 255 * highlight, 0, 255);
          const g = clamp(color[1] * depth + 210 * highlight, 0, 255);
          const b = clamp(color[2] * depth + 255 * highlight, 0, 255);

          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = 255;
        }
      }

      bufferCtx.putImageData(image, 0, 0);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(bufferCanvas, 0, 0, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full"
      aria-hidden="true"
    />
  );
}