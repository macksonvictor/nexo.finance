/**
 * NexoAILoader – Animação de loading da IA estilo Grok
 * Logo NEXO hexagonal pulsante com glow branco irradiando do centro
 */
import { useEffect, useRef } from 'react';

interface NexoAILoaderProps {
  size?: number;
  className?: string;
  label?: string;
}

export function NexoAILoader({ size = 80, className = '', label = 'NEXO IA está analisando...' }: NexoAILoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.38;

    function drawHexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rotation: number) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + rotation;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    function drawNexoLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rotation: number, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;

      // Outer hexagon
      drawHexPath(ctx, cx, cy, r, rotation);
      ctx.strokeStyle = '#F5F5F5';
      ctx.lineWidth = size * 0.025;
      ctx.stroke();

      // Inner hexagon (rotated)
      drawHexPath(ctx, cx, cy, r * 0.55, rotation + Math.PI / 6);
      ctx.strokeStyle = '#BFBFBF';
      ctx.lineWidth = size * 0.02;
      ctx.stroke();

      // Diagonal lines (N shape - NEXO logo)
      const outerPts: [number, number][] = [];
      const innerPts: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + rotation;
        outerPts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
        const ai = (Math.PI / 3) * i + rotation + Math.PI / 6;
        innerPts.push([cx + r * 0.55 * Math.cos(ai), cy + r * 0.55 * Math.sin(ai)]);
      }

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = size * 0.022;
      ctx.lineCap = 'round';

      // Connect outer to inner alternating
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(outerPts[i][0], outerPts[i][1]);
        ctx.lineTo(innerPts[i][0], innerPts[i][1]);
        ctx.stroke();
      }

      ctx.restore();
    }

    function render(timestamp: number) {
      if (!ctx) return;
      const t = timestamp / 1000;
      timeRef.current = t;

      ctx.clearRect(0, 0, size, size);

      // Pulse cycle: 0 → 1 → 0 every 2 seconds
      const pulse = (Math.sin(t * Math.PI) + 1) / 2; // 0..1
      const fastPulse = (Math.sin(t * Math.PI * 2) + 1) / 2;

      // ── Outer glow rings ──────────────────────────────────────────────────
      const glowLayers = [
        { radius: r * (1.6 + pulse * 0.5), alpha: 0.04 + pulse * 0.06 },
        { radius: r * (1.3 + pulse * 0.3), alpha: 0.08 + pulse * 0.1 },
        { radius: r * (1.1 + pulse * 0.15), alpha: 0.15 + pulse * 0.15 },
      ];

      for (const layer of glowLayers) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, layer.radius);
        grad.addColorStop(0, `rgba(255,255,255,${layer.alpha})`);
        grad.addColorStop(0.5, `rgba(200,200,220,${layer.alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, layer.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // ── Light rays ────────────────────────────────────────────────────────
      const numRays = 8;
      for (let i = 0; i < numRays; i++) {
        const angle = (Math.PI * 2 / numRays) * i + t * 0.3;
        const rayLen = r * (1.2 + fastPulse * 0.8);
        const rayAlpha = (0.03 + pulse * 0.07) * (i % 2 === 0 ? 1 : 0.5);

        const grad = ctx.createLinearGradient(
          cx, cy,
          cx + Math.cos(angle) * rayLen,
          cy + Math.sin(angle) * rayLen
        );
        grad.addColorStop(0, `rgba(255,255,255,${rayAlpha})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.cos(angle - 0.08) * rayLen,
          cy + Math.sin(angle - 0.08) * rayLen
        );
        ctx.lineTo(
          cx + Math.cos(angle + 0.08) * rayLen,
          cy + Math.sin(angle + 0.08) * rayLen
        );
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      // ── Center bright core ────────────────────────────────────────────────
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.35);
      coreGrad.addColorStop(0, `rgba(255,255,255,${0.6 + pulse * 0.4})`);
      coreGrad.addColorStop(0.4, `rgba(220,220,255,${0.2 + pulse * 0.2})`);
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // ── NEXO Logo ─────────────────────────────────────────────────────────
      const rotation = t * 0.15; // slow rotation
      const logoAlpha = 0.7 + pulse * 0.3;
      drawNexoLogo(ctx, cx, cy, r, rotation, logoAlpha);

      // ── Logo glow overlay ─────────────────────────────────────────────────
      ctx.save();
      ctx.globalAlpha = 0.3 + pulse * 0.3;
      ctx.filter = `blur(${size * 0.04}px)`;
      drawNexoLogo(ctx, cx, cy, r, rotation, 1);
      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
      />
      {label && (
        <div className="flex items-center gap-1.5">
          <span className="text-[#BFBFBF] text-xs font-medium tracking-wide">{label}</span>
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-[#BFBFBF] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        </div>
      )}
    </div>
  );
}
