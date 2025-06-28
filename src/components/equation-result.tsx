"use client";

import { useRef, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Terminal, Lightbulb, Copy, Download, LineChart as LineChartIcon } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useTypingAnimation } from '@/hooks/use-typing-animation';
import PlotlyChart from "./plotly-chart";

interface EquationResultProps {
  ocrText: string | null;
  correctedText: string | null;
  solution: string[] | null;
  explanation: string[] | null;
  graphData: { isPlottable: boolean; functionStr?: string } | null;
  error: string | null;
  isLoading: boolean;
  inputImageDataUrl: string | null;
}

const TypingExplanation = ({ text }: { text: string }) => {
    const animatedText = useTypingAnimation(text);
    return <pre className="leading-relaxed whitespace-pre-wrap">{animatedText}</pre>;
};

export default function EquationResult({ ocrText, correctedText, solution, explanation, graphData, error, isLoading, inputImageDataUrl }: EquationResultProps) {
  const hasResult = ocrText || correctedText || solution || explanation || error || graphData;
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [openAccordionItem, setOpenAccordionItem] = useState<string | null>(null);
  const [plotRevision, setPlotRevision] = useState(0);

  const handleAccordionChange = (value: string) => {
    setOpenAccordionItem(value);
    if (value === 'graph') {
      // Use a timeout to ensure the plot redraws after the container is visible.
      setTimeout(() => setPlotRevision(r => r + 1), 0);
    }
  }

  const handleCopyExplanation = () => {
    if (!explanation || explanation.length === 0) return;
    const explanationText = explanation.join('\n\n');
    navigator.clipboard.writeText(explanationText);
    toast({ title: "Copied!", description: "Explanation copied to clipboard." });
  };
  
  const handleDownloadTxt = () => {
    const content = [
      `Equation Ace Solution`,
      `=======================`,
      `Solved on: ${new Date().toLocaleString()}`,
      `-----------------------`,
      `User Input (OCR):\n${ocrText || "N/A"}`,
      `\nCorrected Problem:\n${correctedText || "N/A"}`,
      `\nSolution:\n${solution?.join('\n') || "N/A"}`,
      `\nStep-by-step Explanation:\n${explanation?.join('\n\n') || "N/A"}`,
      `-----------------------`,
      `Solved by Equation Ace`
    ].join('\n\n');
  
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Equation-Ace-Solution-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!", description: "Solution saved as a .txt file." });
  };
  
  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element) return;
  
    toast({ title: "Generating PDF...", description: "Please wait a moment." });
  
    // Temporarily make the element visible for rendering but keep it off-screen
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '-9999px';
    element.style.display = 'block';
    
    // Get background color from CSS var
    const darkBg = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
  
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: `hsl(${darkBg})`,
        scale: 2,
        useCORS: true,
      });
  
      const data = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProperties = pdf.getImageProperties(data);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;
      
      pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Equation-Ace-Solution-${new Date().toISOString().slice(0,10)}.pdf`);
      toast({ title: "Downloaded!", description: "Solution saved as a .pdf file." });
    } catch(err) {
      console.error(err);
      toast({ variant: 'destructive', title: "PDF Error", description: "Could not generate PDF." });
    } finally {
      // Hide it again
      element.style.display = 'none';
      element.style.position = 'static';
    }
  };


  if (!isLoading && !hasResult) {
    return null;
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      {isLoading ? (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Extracted Text (OCR)</h3>
            <p className="font-code text-lg bg-muted p-3 rounded-md min-h-[44px] break-all whitespace-pre-wrap">{ocrText || '...'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">AI Corrected Text</h3>
            <p className="font-code text-lg bg-muted p-3 rounded-md min-h-[44px] break-all whitespace-pre-wrap">{correctedText || '...'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Solution</h3>
            <div className="font-code text-xl font-bold text-primary bg-muted p-4 rounded-md min-h-[52px]">
              {solution && solution.length > 0 ? (
                solution.map((s, i) => <p key={i}>{s}</p>)
              ) : (
                <p className="text-muted-foreground text-lg font-normal">No solution found.</p>
              )}
            </div>
            <Accordion type="single" collapsible className="w-full mt-2" onValueChange={handleAccordionChange}>
              {explanation && explanation.length > 0 && (
                  <AccordionItem value="explanation">
                    <AccordionTrigger className="text-sm hover:no-underline">
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Show step-by-step explanation
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="relative group">
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyExplanation}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy explanation</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleDownloadTxt}>Download as .txt</DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDownloadPdf}>Download as .pdf</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download solution</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="space-y-3 font-code text-sm bg-muted p-4 rounded-b-md border-t-0 -mt-2">
                           {openAccordionItem === 'explanation' && <TypingExplanation text={explanation.join('\n\n')} />}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
              )}
              {graphData?.isPlottable && graphData.functionStr && (
                <AccordionItem value="graph">
                    <AccordionTrigger className="text-sm hover:no-underline">
                      <LineChartIcon className="mr-2 h-4 w-4" />
                      Show Graph Visualization
                    </AccordionTrigger>
                    <AccordionContent forceMount>
                       <div className="h-[400px] w-full bg-muted p-4 rounded-b-md">
                         <PlotlyChart functionStr={graphData.functionStr} revision={plotRevision} />
                       </div>
                    </AccordionContent>
                  </AccordionItem>
              )}
            </Accordion>
          </div>
        </div>
      )}
      
      <div ref={printRef} className="bg-background text-foreground" style={{ display: 'none', width: '210mm', padding: '10mm', fontFamily: 'monospace', fontSize: '12px' }}>
          <style>{`
            @media print {
              body { -webkit-print-color-adjust: exact; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            }
          `}</style>
          <h1 style={{ fontSize: '24px', textAlign: 'center', marginBottom: '10px' }}>Equation Ace Solution</h1>
          <p style={{borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px', marginBottom: '10px'}}>Solved on: {new Date().toLocaleString()}</p>
          
          {inputImageDataUrl && (
              <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '16px', borderBottom: '1px solid hsl(var(--muted))', paddingBottom: '5px' }}>Problem Image:</h2>
                  <img src={inputImageDataUrl} alt="User provided problem" style={{ maxWidth: '100%', border: '1px solid hsl(var(--border))', marginTop: '10px', borderRadius: '4px' }} />
              </div>
          )}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', borderBottom: '1px solid hsl(var(--muted))', paddingBottom: '5px' }}>User Input (OCR):</h2>
            <pre className="bg-muted text-foreground" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', padding: '10px', borderRadius: '4px' }}>{ocrText || "N/A"}</pre>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', borderBottom: '1px solid hsl(var(--muted))', paddingBottom: '5px' }}>Corrected Problem:</h2>
            <pre className="bg-muted text-foreground" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', padding: '10px', borderRadius: '4px' }}>{correctedText || "N/A"}</pre>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', borderBottom: '1px solid hsl(var(--muted))', paddingBottom: '5px' }}>Solution:</h2>
            <pre className="bg-muted text-primary" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', padding: '10px', borderRadius: '4px', fontWeight: 'bold' }}>{solution?.join('\n') || "N/A"}</pre>
          </div>
           <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', borderBottom: '1px solid hsl(var(--muted))', paddingBottom: '5px' }}>Step-by-step Explanation:</h2>
            <pre className="bg-muted text-foreground" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', padding: '10px', borderRadius: '4px' }}>{explanation?.join('\n\n') || "N/A"}</pre>
          </div>
          <p style={{borderTop: '1px solid hsl(var(--border))', paddingTop: '10px', marginTop: '20px', textAlign: 'center', fontSize: '10px' }}>Solved by Equation Ace</p>
      </div>

    </div>
  );
}
