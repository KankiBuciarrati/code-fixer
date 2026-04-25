import { useEffect, useRef } from "react";

interface WaveformProps {
  data: Float32Array;
}

export function Waveform({ data }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Center line
    ctx.strokeStyle = "rgba(20,210,150,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    // Waveform
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, "#14d296");
    grad.addColorStop(0.5, "#00f5c4");
    grad.addColorStop(1, "#38bdf8");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const step = W / data.length;
    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const y = (1 - (data[i] + 1) / 2) * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={140}
      className="w-full rounded-lg"
      style={{ background: "rgba(10,15,25,0.6)", border: "1px solid rgba(20,210,150,0.15)" }}
    />
  );
}
