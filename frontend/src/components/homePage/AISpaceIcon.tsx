import React, { useEffect, useRef } from 'react';
import './AISpaceIcon.css';

interface AISpaceIconProps {
  backgroundColor?: string;
  circleSize?: number;
  polygonSize?: number;
  strokeColor?: string;
  baseIntensity?: number;
}

const AISpaceIcon: React.FC<AISpaceIconProps> = ({
  backgroundColor = '#000051',
  circleSize = 64,
  polygonSize = 48,
  strokeColor = '#FFFFFF',
  baseIntensity = 0.3
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Function to parse color and return rgba
    const parseColor = (color: string, alpha: number) => {
      const dummyElement = document.createElement('div');
      dummyElement.style.color = color;
      document.body.appendChild(dummyElement);
      const computedColor = getComputedStyle(dummyElement).color;
      document.body.removeChild(dummyElement);

      const match = computedColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (match) {
        return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
      }
      return color; // Fallback to original color if parsing fails
    };

    // Define vertices of a dodecahedron
    const phi = (1 + Math.sqrt(5)) / 2;
    const scale = polygonSize / 4;
    const vertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
      [0, -phi, -1 / phi], [0, phi, -1 / phi], [0, phi, 1 / phi], [0, -phi, 1 / phi],
      [-1 / phi, 0, -phi], [1 / phi, 0, -phi], [1 / phi, 0, phi], [-1 / phi, 0, phi],
      [-phi, -1 / phi, 0], [phi, -1 / phi, 0], [phi, 1 / phi, 0], [-phi, 1 / phi, 0]
    ].map(v => v.map(c => c * scale / 15));

    // Define edges
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 8], [1, 8], [2, 9], [3, 9], [4, 11], [5, 11], [6, 10], [7, 10],
      [8, 11], [9, 10], [12, 13], [13, 14], [14, 15], [15, 12],
      [0, 12], [1, 13], [2, 13], [3, 12], [4, 15], [5, 14], [6, 14], [7, 15],
      [8, 16], [11, 16], [9, 19], [10, 19], [16, 17], [17, 18], [18, 19], [19, 16],
      [12, 16], [13, 17], [14, 18], [15, 19]
    ];

    const draw = (time: number) => {
      ctx.clearRect(0, 0, circleSize, circleSize);

      // Background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, circleSize, circleSize);

      // 3D rotation
      const angleX = time * 0.0001;
      const angleY = time * 0.00015;
      const angleZ = time * 0.00005;

      const rotateX = (v: number[]) => [
        v[0],
        v[1] * Math.cos(angleX) - v[2] * Math.sin(angleX),
        v[1] * Math.sin(angleX) + v[2] * Math.cos(angleX)
      ];

      const rotateY = (v: number[]) => [
        v[0] * Math.cos(angleY) + v[2] * Math.sin(angleY),
        v[1],
        -v[0] * Math.sin(angleY) + v[2] * Math.cos(angleY)
      ];

      const rotateZ = (v: number[]) => [
        v[0] * Math.cos(angleZ) - v[1] * Math.sin(angleZ),
        v[0] * Math.sin(angleZ) + v[1] * Math.cos(angleZ),
        v[2]
      ];

      const project = (v: number[]) => [
        (v[0] / (v[2] + 50) + 1) * polygonSize / 2 + (circleSize - polygonSize) / 2,
        (v[1] / (v[2] + 50) + 1) * polygonSize / 2 + (circleSize - polygonSize) / 2
      ];

      // Draw edges
      edges.forEach(([i, j]) => {
        const v1 = project(rotateZ(rotateY(rotateX(vertices[i]))));
        const v2 = project(rotateZ(rotateY(rotateX(vertices[j]))));

        // Calculate edge intensity
        const edgeIntensity = (Math.sin(time * 0.003 + i * 0.5) + 1) / 2;
        const alpha = baseIntensity + (1 - baseIntensity) * edgeIntensity;

        ctx.beginPath();
        ctx.moveTo(v1[0], v1[1]);
        ctx.lineTo(v2[0], v2[1]);
        ctx.strokeStyle = parseColor(strokeColor, alpha);
        ctx.lineWidth = (circleSize / 128) * (0.8 + edgeIntensity * 0.5); // Scale line width
        ctx.stroke();
      });

      // Draw vertices
      vertices.forEach((v, i) => {
        const [x, y] = project(rotateZ(rotateY(rotateX(v))));
        ctx.beginPath();
        ctx.arc(x, y, circleSize / 80, 0, Math.PI * 2);

        // Synapse-like lighting effect
        const intensity = (Math.sin(time * 0.003 + i * 0.5) + 1) / 2;
        const alpha = baseIntensity + (1 - baseIntensity) * intensity;
        ctx.fillStyle = parseColor(strokeColor, alpha);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [backgroundColor, circleSize, polygonSize, strokeColor, baseIntensity]);

  return (
    <canvas
      ref={canvasRef}
      width={circleSize}
      height={circleSize}
      className="ai-space-icon"
      style={{ width: `${circleSize}px`, height: `${circleSize}px` }}
    />
  );
};

export default AISpaceIcon;
