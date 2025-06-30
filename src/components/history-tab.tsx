"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { type Equation } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import { KeyRound, Info, LineChart as LineChartIcon } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PlotlyChart from "./plotly-chart";


export default function HistoryTab() {
  const { user, loading: authLoading } = useAuth();
  const [equations, setEquations] = useState<Equation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAccordionItem, setOpenAccordionItem] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setEquations([]);
      return;
    }
    
    if (!db) {
        setLoading(false);
        setEquations([]);
        return;
    }

    setLoading(true);
    // Query without ordering to prevent missing index errors.
    // We will sort on the client-side.
    const q = query(
      collection(db, "equations"), 
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userEquations: Equation[] = [];
      querySnapshot.forEach((doc) => {
        userEquations.push({ id: doc.id, ...doc.data() } as Equation);
      });
      
      // Sort equations by creation date, newest first.
      userEquations.sort((a, b) => {
        const aDate = a.createdAt?.toDate() ?? new Date(0);
        const bDate = b.createdAt?.toDate() ?? new Date(0);
        return bDate.getTime() - aDate.getTime();
      });

      setEquations(userEquations);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching equation history:", error);
      setLoading(false)
    });

    return () => unsubscribe();
  }, [user]);

  if (authLoading) {
    return <HistorySkeleton />;
  }

  if (!user) {
    return (
      <Alert>
        <KeyRound className="h-4 w-4" />
        <AlertTitle>Please Log In</AlertTitle>
        <AlertDescription>
          Log in to view your equation history and save new solutions.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return <HistorySkeleton />;
  }
  
  return (
    <div className="animate-in fade-in-0 duration-500">
      <h2 className="text-2xl font-bold mb-4">Your Equation History</h2>
      {equations.length === 0 ? (
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No History Found</AlertTitle>
            <AlertDescription>
            You haven't solved any equations yet. Use the "Solve" tab to get started!
            </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equations.map((eq) => (
            <Card key={eq.id} className="flex flex-col transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/20">
              <CardHeader>
                <div className="aspect-video relative w-full bg-muted rounded-lg overflow-hidden border">
                    <Image
                        src={eq.imageUrl}
                        alt="Equation image"
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-grow">
                 <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">OCR Text</h4>
                    <p className="font-code bg-muted p-2 rounded text-sm break-all">{eq.ocrText}</p>
                 </div>
                 <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Solution</h4>
                    <p className="font-code text-primary font-bold bg-muted p-2 rounded text-sm break-all">
                        {eq.solvedResult.join(', ')}
                    </p>
                 </div>
                  <Accordion type="single" collapsible className="w-full text-sm" onValueChange={(value) => setOpenAccordionItem(value)}>
                      {eq.explanation && eq.explanation.length > 0 && (
                          <AccordionItem value={`explanation-${eq.id}`}>
                              <AccordionTrigger className="py-2 text-xs hover:no-underline">View Explanation</AccordionTrigger>
                              <AccordionContent>
                                  <div className="space-y-1 font-code bg-muted p-2 rounded text-xs border-t">
                                      {eq.explanation.map((step, i) => <p key={i} className="leading-relaxed whitespace-pre-wrap">{step}</p>)}
                                  </div>
                              </AccordionContent>
                          </AccordionItem>
                      )}
                      {eq.graphData?.isPlottable && eq.graphData.functionStr && (
                         <AccordionItem value={`graph-${eq.id}`}>
                              <AccordionTrigger className="py-2 text-xs hover:no-underline"><LineChartIcon className="mr-2 h-4 w-4" />View Graph</AccordionTrigger>
                              <AccordionContent>
                                  <div className="h-[250px] w-full bg-muted p-2 rounded-b-md">
                                    {openAccordionItem === `graph-${eq.id}` && (
                                      <PlotlyChart functionStr={eq.graphData.functionStr} isHistory={true} />
                                    )}
                                  </div>
                              </AccordionContent>
                          </AccordionItem>
                      )}
                  </Accordion>
              </CardContent>
              <CardFooter>
                 <p className="text-xs text-muted-foreground">
                    {eq.createdAt ? `Solved ${formatDistanceToNow(eq.createdAt.toDate())} ago` : ''}
                 </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div>
       <h2 className="text-2xl font-bold mb-4">Your Equation History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
            <Card key={i}>
            <CardHeader>
                <Skeleton className="aspect-video w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-8 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-3 w-1/5" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </CardContent>
            <CardFooter>
                <Skeleton className="h-3 w-1/3" />
            </CardFooter>
            </Card>
        ))}
        </div>
    </div>
  );
}
