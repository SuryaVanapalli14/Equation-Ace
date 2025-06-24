"use client";

import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Button } from './ui/button';
import { Eraser, Pencil, Trash2 } from 'lucide-react';

interface CanvasProps {
  className?: string;
}

export interface CanvasRef {
  getDataURL: () => string;
  clear: () => void;
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(({ className }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [drawMode, setDrawMode] = useState<'draw' | 'erase'>('draw');

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas && ctx) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext('2d');
                if (context) {
                    setCtx(context);
                    // Initial clear
                    context.fillStyle = "white";
                    context.fillRect(0, 0, canvas.width, canvas.height);
                }
            }
        });
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineWidth = drawMode === 'erase' ? 25 : 5;
        ctx.strokeStyle = drawMode === 'draw' ? 'black' : 'white';
    }
  }, [ctx, drawMode]);

  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      const canvas = canvasRef.current;
      if (!canvas) return "";
      // Create a new canvas to add a small margin
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      const margin = 20;
      tempCanvas.width = canvas.width + margin * 2;
      tempCanvas.height = canvas.height + margin * 2;
      if(!tempCtx) return "";
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, margin, margin);
      return tempCanvas.toDataURL('image/png');
    },
    clear: clearCanvas,
  }));

  const getCoords = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const eventSource = 'touches' in event ? event.touches[0] : event;
    return {
        x: eventSource.clientX - rect.left,
        y: eventSource.clientY - rect.top,
    };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    if (ctx) {
      const { x, y } = getCoords(event);
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (isDrawing && ctx) {
      const { x, y } = getCoords(event);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (ctx) {
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  return (
    <div className='flex flex-col items-center gap-4 w-full'>
      <div ref={containerRef} className='w-full max-w-xl aspect-[16/9]'>
        <canvas
            ref={canvasRef}
            className="border border-muted rounded-lg bg-white touch-none w-full h-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
       </div>
      <div className="flex items-center gap-2">
        <Button variant={drawMode === 'draw' ? 'secondary' : 'outline'} onClick={() => setDrawMode('draw')}>
            <Pencil className="mr-2 h-4 w-4" />
            Draw
        </Button>
        <Button variant={drawMode === 'erase' ? 'secondary' : 'outline'} onClick={() => setDrawMode('erase')}>
            <Eraser className="mr-2 h-4 w-4" />
            Erase
        </Button>
        <Button variant="outline" onClick={clearCanvas}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
        </Button>
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
