import type { CSSProperties } from "react";
import "./NexoAIResponseLoader.css";

interface NexoAIResponseLoaderProps {
  size?: number;
  visualScale?: number;
  className?: string;
  label?: string;
}

const BURST_ANGLES = [
  "0deg",
  "30deg",
  "60deg",
  "90deg",
  "120deg",
  "150deg",
  "180deg",
  "210deg",
  "240deg",
  "270deg",
  "300deg",
  "330deg",
];

export function NexoAIResponseLoader({
  size = 88,
  visualScale = 1,
  className = "",
  label = "Nexo IA está preparando a resposta...",
}: NexoAIResponseLoaderProps) {
  const accessibilityLabel = label || "Carregando resposta da Nexo IA";

  return (
    <div
      className={`nexo-ai-response-loader ${className}`.trim()}
      style={
        {
          "--loader-size": `${size}px`,
          "--visual-scale": visualScale,
        } as CSSProperties
      }
      role="status"
      aria-live="polite"
      aria-label={accessibilityLabel}
    >
      <div
        className="nexo-ai-response-stage"
        aria-hidden="true"
      >
        <div className="nexo-ai-response-orbit nexo-ai-response-orbit-sparks">
          <span className="nexo-ai-response-bit nexo-ai-response-bit-bar nexo-ai-response-bit-top" />
          <span className="nexo-ai-response-bit nexo-ai-response-bit-bar nexo-ai-response-bit-right" />
          <span className="nexo-ai-response-bit nexo-ai-response-bit-bar nexo-ai-response-bit-bottom" />
          <span className="nexo-ai-response-bit nexo-ai-response-bit-dot nexo-ai-response-bit-dot-a" />
          <span className="nexo-ai-response-bit nexo-ai-response-bit-dot nexo-ai-response-bit-dot-b" />
        </div>

        <div className="nexo-ai-response-orbit nexo-ai-response-orbit-corners">
          <span className="nexo-ai-response-corner nexo-ai-response-corner-a" />
          <span className="nexo-ai-response-corner nexo-ai-response-corner-b" />
          <span className="nexo-ai-response-corner nexo-ai-response-corner-c" />
          <span className="nexo-ai-response-corner nexo-ai-response-corner-d" />
          <span className="nexo-ai-response-orbit-dot nexo-ai-response-orbit-dot-a" />
          <span className="nexo-ai-response-orbit-dot nexo-ai-response-orbit-dot-b" />
          <span className="nexo-ai-response-orbit-dot nexo-ai-response-orbit-dot-c" />
          <span className="nexo-ai-response-orbit-dot nexo-ai-response-orbit-dot-d" />
        </div>

        <div className="nexo-ai-response-diamond nexo-ai-response-diamond-outer" />
        <div className="nexo-ai-response-diamond nexo-ai-response-diamond-inner" />

        <div className="nexo-ai-response-burst">
          {BURST_ANGLES.map((angle) => (
            <span
              key={angle}
              style={{ "--angle": angle } as CSSProperties}
            />
          ))}
        </div>

        <div className="nexo-ai-response-lanes nexo-ai-response-lanes-left">
          <span />
          <span />
          <span />
        </div>

        <div className="nexo-ai-response-lanes nexo-ai-response-lanes-right">
          <span />
          <span />
          <span />
        </div>

        <div className="nexo-ai-response-square-ring nexo-ai-response-square-ring-outer" />
        <div className="nexo-ai-response-square-ring nexo-ai-response-square-ring-inner" />
        <div className="nexo-ai-response-center-square" />
        <div className="nexo-ai-response-final-shell" />
        <div className="nexo-ai-response-final-cutout" />
      </div>

      {label ? <span className="nexo-ai-response-label">{label}</span> : null}
    </div>
  );
}
