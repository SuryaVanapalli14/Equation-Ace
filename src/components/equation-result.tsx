"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Terminal, Lightbulb } from "lucide-react";

interface EquationResultProps {
  ocrText: string | null;
  correctedText: string | null;
  solution: string[] | null;
  explanation: string[] | null;
  error: string | null;
  isLoading: boolean;
}

export default function EquationResult({ ocrText, correctedText, solution, explanation, error, isLoading }: EquationResultProps) {
  const hasResult = ocrText || correctedText || solution || explanation || error;
  
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
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Extracted Equation (OCR)</h3>
            <p className="font-code text-lg bg-muted p-3 rounded-md min-h-[44px] break-all">{ocrText || '...'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">AI Corrected Equation</h3>
            <p className="font-code text-lg bg-muted p-3 rounded-md min-h-[44px] break-all">{correctedText || '...'}</p>
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
            {explanation && explanation.length > 0 && (
               <Accordion type="single" collapsible className="w-full mt-2">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Show step-by-step explanation
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 font-code text-sm bg-muted p-4 rounded-b-md border-t-0 -mt-2">
                      {explanation.map((step, i) => (
                        <p key={i} className="leading-relaxed">{step}</p>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
