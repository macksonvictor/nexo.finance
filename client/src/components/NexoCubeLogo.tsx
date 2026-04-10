import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import "./NexoCubeLogo.css";

interface NexoCubeLogoProps {
  size?: number;
  className?: string;
  decorative?: boolean;
  ariaLabel?: string;
}

export function NexoCubeLogo({
  size = 32,
  className,
  decorative = true,
  ariaLabel = "Nexo IA",
}: NexoCubeLogoProps) {
  const cubeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cube = cubeRef.current;
    if (!cube) return;

    let q: [number, number, number, number] = [1, 0, 0, 0];
    let angVel: [number, number, number] = [0.007, 0.022, 0.006];
    let targetAV: [number, number, number] = [0.007, 0.022, 0.006];
    let timer = 0;
    const speedMult = 3.2;
    let frameId = 0;

    const pickTarget = () => {
      const randomVelocity = () => (Math.random() - 0.5) * 0.03;
      targetAV = [
        randomVelocity() * 0.5,
        randomVelocity(),
        randomVelocity() * 0.4,
      ];
      timer = Math.floor(Math.random() * 150 + 80);
    };

    const multiplyQuaternions = (
      a: [number, number, number, number],
      b: [number, number, number, number]
    ): [number, number, number, number] => [
      a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
      a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
      a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
      a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
    ];

    const normalizeQuaternion = (
      input: [number, number, number, number]
    ): [number, number, number, number] => {
      const length = Math.hypot(input[0], input[1], input[2], input[3]) || 1;
      return [
        input[0] / length,
        input[1] / length,
        input[2] / length,
        input[3] / length,
      ];
    };

    const quaternionToMatrix3d = (input: [number, number, number, number]) => {
      const [w, x, y, z] = input;
      return [
        1 - 2 * y * y - 2 * z * z,
        2 * x * y + 2 * w * z,
        2 * x * z - 2 * w * y,
        0,
        2 * x * y - 2 * w * z,
        1 - 2 * x * x - 2 * z * z,
        2 * y * z + 2 * w * x,
        0,
        2 * x * z + 2 * w * y,
        2 * y * z - 2 * w * x,
        1 - 2 * x * x - 2 * y * y,
        0,
        0,
        0,
        0,
        1,
      ];
    };

    const stepQuaternion = (ax: number, ay: number, az: number) => {
      const rotationX: [number, number, number, number] = [
        Math.cos(ax / 2),
        Math.sin(ax / 2),
        0,
        0,
      ];
      const rotationY: [number, number, number, number] = [
        Math.cos(ay / 2),
        0,
        Math.sin(ay / 2),
        0,
      ];
      const rotationZ: [number, number, number, number] = [
        Math.cos(az / 2),
        0,
        0,
        Math.sin(az / 2),
      ];

      q = normalizeQuaternion(
        multiplyQuaternions(
          multiplyQuaternions(multiplyQuaternions(rotationZ, rotationY), rotationX),
          q
        )
      );
    };

    const applyRotation = () => {
      cube.style.transform = `matrix3d(${quaternionToMatrix3d(q).join(",")})`;
    };

    const animate = () => {
      for (let index = 0; index < 3; index += 1) {
        angVel[index] += (targetAV[index] - angVel[index]) * 0.008;
      }

      stepQuaternion(
        angVel[0] * speedMult,
        angVel[1] * speedMult,
        angVel[2] * speedMult
      );
      applyRotation();

      timer -= 1;
      if (timer <= 0) pickTarget();

      frameId = window.requestAnimationFrame(animate);
    };

    pickTarget();
    applyRotation();
    frameId = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const style = {
    "--cube-size": `${size}px`,
  } as CSSProperties;

  return (
    <div
      className={["nexo-cube-logo", className].filter(Boolean).join(" ")}
      style={style}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
      role={decorative ? undefined : "img"}
    >
      <div className="nexo-cube-logo__cube" ref={cubeRef}>
        <div className="nexo-cube-logo__face nexo-cube-logo__face--front" />
        <div className="nexo-cube-logo__face nexo-cube-logo__face--back" />
        <div className="nexo-cube-logo__face nexo-cube-logo__face--left" />
        <div className="nexo-cube-logo__face nexo-cube-logo__face--right" />
        <div className="nexo-cube-logo__face nexo-cube-logo__face--top" />
        <div className="nexo-cube-logo__face nexo-cube-logo__face--bottom" />
      </div>
    </div>
  );
}
