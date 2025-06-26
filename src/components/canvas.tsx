"use client";

import { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Eraser, Pencil, Trash2, Palette, Grid3x3, Minus, AlignJustify } from 'lucide-react';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CanvasProps {
  className?: string;
  onInteraction?: () => void;
}

export interface CanvasRef {
  getDataURL: () => string;
  clear: () => void;
}

type GridType = 'none' | 'math' | 'lines';

const Canvas = forwardRef<CanvasRef, CanvasProps>(({ className, onInteraction }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [drawMode, setDrawMode] = useState<'draw' | 'erase'>('draw');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [strokeColor, setStrokeColor] = useState('#FFFFFF');
  const [grid, setGrid] = useState<GridType>('none');

  const drawGrid = useCallback((gridType: GridType, context: CanvasRenderingContext2D, width: number, height: number) => {
    if (gridType === 'none') return;
    context.beginPath();
    context.lineWidth = 0.5;

    if (gridType === 'math') {
      context.strokeStyle = 'hsl(var(--border))';
      for (let x = 0; x <= width; x += 20) {
        context.moveTo(x, 0);
        context.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += 20) {
        context.moveTo(0, y);
        context.lineTo(width, y);
      }
    } else if (gridType === 'lines') {
      context.strokeStyle = 'hsl(var(--muted-foreground))';
      for (let y = 0; y <= height; y += 25) {
        context.moveTo(0, y);
        context.lineTo(width, y);
      }
      context.strokeStyle = 'hsl(var(--primary))';
      context.globalAlpha = 0.5;
      context.moveTo(30, 0);
      context.lineTo(30, height);
      context.globalAlpha = 1.0;
    }
    context.stroke();
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(grid, ctx, canvas.width, canvas.height);
    }
  }, [ctx, grid, drawGrid]);


  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                  const context = canvas.getContext('2d');
                  const tempCanvas = document.createElement('canvas');
                  tempCanvas.width = canvas.width;
                  tempCanvas.height = canvas.height;
                  const tempCtx = tempCanvas.getContext('2d');
                  if(tempCtx) {
                    tempCtx.drawImage(canvas, 0, 0);
                  }

                  canvas.width = width;
                  canvas.height = height;
                  
                  if (context) {
                      setCtx(context);
                      context.drawImage(tempCanvas, 0, 0);
                      drawGrid(grid, context, width, height);
                  }
                }
            }
        });
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }
  }, [grid, drawGrid]);

  useEffect(() => {
    if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineWidth = drawMode === 'erase' ? 25 : strokeWidth;
        // In erase mode, we draw with a transparent color to "erase" content.
        ctx.globalCompositeOperation = drawMode === 'erase' ? 'destination-out' : 'source-over';
    }
  }, [ctx, drawMode, strokeWidth]);
  
  useEffect(() => {
    if (ctx) {
        ctx.strokeStyle = strokeColor;
    }
  }, [ctx, strokeColor]);

  useEffect(() => {
    clearCanvas();
  }, [grid, clearCanvas]);

  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      const canvas = canvasRef.current;
      if (!canvas) return "";

      const dataCanvas = document.createElement('canvas');
      dataCanvas.width = canvas.width;
      dataCanvas.height = canvas.height;
      const dataCtx = dataCanvas.getContext('2d');
      if(!dataCtx) return "";

      // Draw a background that matches the theme
      dataCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card').trim() || '#0f172a';
      dataCtx.fillRect(0,0, dataCanvas.width, dataCanvas.height);
      dataCtx.drawImage(canvas, 0, 0);

      // Add a margin to the final image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      const margin = 20;
      tempCanvas.width = canvas.width + margin * 2;
      tempCanvas.height = canvas.height + margin * 2;
      if(!tempCtx) return "";
      tempCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card').trim() || '#0f172a';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(dataCanvas, margin, margin);

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
    onInteraction?.();
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
  
  const colors = ['#FFFFFF', '#3b82f6', '#ef4444'];

  return (
    <div className='flex flex-col items-center gap-4 w-full h-full'>
      <div ref={containerRef} className='w-full flex-grow rounded-lg overflow-hidden'>
        <canvas
            ref={canvasRef}
            className="border border-muted rounded-lg bg-card touch-none w-full h-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
       </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 w-full">
        <div className="flex items-center gap-2">
            <Button variant={drawMode === 'draw' ? 'secondary' : 'outline'} size="sm" onClick={() => setDrawMode('draw')}><Pencil /> Draw</Button>
            <Button variant={drawMode === 'erase' ? 'secondary' : 'outline'} size="sm" onClick={() => setDrawMode('erase')}><Eraser /> Erase</Button>
            <Button variant="outline" size="sm" onClick={clearCanvas}><Trash2 /> Clear</Button>
        </div>

        <div className={cn('flex items-center gap-2 transition-opacity', drawMode !== 'draw' ? 'opacity-50 pointer-events-none' : 'opacity-100')}>
            <Label htmlFor="stroke-color"><Palette /></Label>
            {colors.map(color => (
                <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    className={cn('w-6 h-6 rounded-full border-2 transition-transform', strokeColor === color ? 'scale-110 border-primary' : 'border-transparent')}
                    style={{ backgroundColor: color }}
                    disabled={drawMode !== 'draw'}
                />
            ))}
        </div>
        
        <div className={cn('flex items-center gap-2 flex-grow min-w-[150px] transition-opacity', drawMode !== 'draw' ? 'opacity-50 pointer-events-none' : 'opacity-100')}>
            <Label htmlFor="stroke-width" className="text-sm whitespace-nowrap">Size</Label>
            <Slider
                id="stroke-width"
                min={1}
                max={20}
                step={1}
                value={[strokeWidth]}
                onValueChange={(value) => setStrokeWidth(value[0])}
                disabled={drawMode !== 'draw'}
            />
        </div>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    {grid === 'none' && <Minus />}
                    {grid === 'math' && <Grid3x3 />}
                    {grid === 'lines' && <AlignJustify />}
                    <span className="ml-2">Grid</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setGrid('none')}>
                    <Minus className="mr-2 h-4 w-4" /> No Grid
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGrid('math')}>
                    <Grid3x3 className="mr-2 h-4 w-4" /> Math Grid
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGrid('lines')}>
                    <AlignJustify className="mr-2 h-4 w-4" /> Ruled Lines
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
