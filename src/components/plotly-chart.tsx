"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import * as math from 'mathjs';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface PlotlyChartProps {
  functionStr: string;
  className?: string;
  isHistory?: boolean;
}

const PlotlyChart = ({ functionStr, className, isHistory = false }: PlotlyChartProps) => {
  const [plotState, setPlotState] = useState<{data: any[], layout: any} | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!functionStr) return;
      const compiledExpr = math.compile(functionStr);
      // Increased the number of points for a smoother curve by reducing the step value.
      const xValues = math.range(-10, 10.05, 0.05).toArray() as number[];
      const yValues = xValues.map(x => compiledExpr.evaluate({ x }));
      
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      const mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();
      const foregroundColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
      const mutedForegroundColor = getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim();

      const layout = {
        title: isHistory ? undefined : `Plot of y = ${functionStr}`,
        autosize: true,
        font: {
          color: `hsl(${foregroundColor})`,
          size: isHistory ? 10 : undefined,
        },
        xaxis: {
          gridcolor: `hsl(${mutedForegroundColor})`,
          zerolinecolor: `hsl(${foregroundColor})`,
          zerolinewidth: isHistory ? 1 : 1.5,
        },
        yaxis: {
          gridcolor: `hsl(${mutedForegroundColor})`,
          zerolinecolor: `hsl(${foregroundColor})`,
          zerolinewidth: isHistory ? 1 : 1.5,
        },
        plot_bgcolor: `hsl(${mutedColor})`,
        paper_bgcolor: `hsl(${mutedColor})`,
        margin: isHistory ? { l: 25, r: 25, b: 25, t: 25 } : { l: 40, r: 40, b: 40, t: 80 },
      };

      setPlotState({
        data: [{
          x: xValues,
          y: yValues,
          type: 'scatter',
          mode: 'lines',
          line: { 
            color: `hsl(${primaryColor})`,
            width: isHistory ? 2 : 3,
          },
        }],
        layout,
      });
      setError(null);
    } catch (e) {
      console.error('Plotting Error:', e);
      setError(isHistory ? 'Invalid expression.' : 'Could not plot the function. Invalid expression provided by AI.');
      setPlotState(null);
    }
  }, [functionStr, isHistory]);

  if (error) {
    return <div className={`flex items-center justify-center h-full text-destructive ${isHistory ? 'text-xs' : ''}`}>{error}</div>;
  }

  if (!plotState) {
    return <div className={`flex items-center justify-center h-full ${isHistory ? 'text-xs' : ''}`}>Generating graph...</div>;
  }

  return (
    <Plot
      data={plotState.data}
      layout={plotState.layout}
      config={{ responsive: true, displaylogo: false }}
      className={className || 'w-full h-full'}
    />
  );
};

export default PlotlyChart;
