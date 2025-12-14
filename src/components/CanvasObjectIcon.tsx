import React, { useRef, useEffect } from 'react';

interface CanvasObjectIconProps {
  type: string;
  subtype?: string;
  size?: number;
}

export default function CanvasObjectIcon({ type, subtype, size = 40 }: CanvasObjectIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Center the drawing
    ctx.save();
    ctx.translate(size / 2, size / 2);

    // Scale factor for visibility
    const scale = size / 40;
    ctx.scale(scale, scale);

    // Draw different symbols based on type (matching ChartEditor drawing logic)
    switch (type) {
      case 'signal':
        // Traffic signal - color varies by subtype
        let signalColor = '#ef4444';
        if (subtype === 'Output') signalColor = '#22c55e';
        else if (subtype === 'Warning') signalColor = '#eab308';

        ctx.fillStyle = signalColor;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;

      case 'switch':
        // Railway switch
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(8, -8);
        ctx.stroke();
        break;

      case 'crossing':
        // Level crossing - different style for guarded vs unguarded
        const isGuarded = subtype === 'Guarded';
        ctx.strokeStyle = isGuarded ? '#1f2937' : '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(8, 8);
        ctx.moveTo(-8, 8);
        ctx.lineTo(8, -8);
        ctx.stroke();

        if (isGuarded) {
          // Add circle for guarded crossings
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;

      case 'tunnel':
        // Tunnel
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, Math.PI, 0);
        ctx.lineTo(10, 5);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.stroke();
        break;

      case 'bridge':
        // Bridge
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.lineTo(10, -5);
        ctx.moveTo(-10, -5);
        ctx.lineTo(-10, 5);
        ctx.moveTo(10, -5);
        ctx.lineTo(10, 5);
        ctx.stroke();
        break;
    }

    ctx.restore();
  }, [type, subtype, size]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}
