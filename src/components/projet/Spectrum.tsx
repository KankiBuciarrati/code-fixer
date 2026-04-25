import { useEffect, useRef } from "react";

interface SpectrumProps {
  data: Uint8Array;
}

export function Spectrum({ data }: SpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const bars = 96;
    const step = Math.floor(data.length / bars);
    const barW = W / bars - 2;

    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) sum += data[i * step + j];
      const avg = sum / step;
      const barH = (avg / 255) * H;

      const ratio = i / bars;
      // Emerald → cyan → blue gradient (matches site theme)
      const r = Math.round(20 + ratio * 36);
      const g = Math.round(210 - ratio * 21);
      const b = Math.round(150 + ratio * 98);

      const grad = ctx.createLinearGradient(0, H, 0, H - barH);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0.4)`);
      ctx.fillStyle = grad;
      ctx.fillRect(i * (barW + 2), H - barH, barW, barH);
    }
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={180}
      className="w-full rounded-lg"
      style={{ background: "rgba(10,15,25,0.6)", border: "1px solid rgba(20,210,150,0.15)" }}
    />
  );
}
