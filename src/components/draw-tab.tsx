"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Canvas, { type CanvasRef } from "./canvas";
import EquationResult from "./equation-result";
import { BrainCircuit } from "lucide-react";

import { extractEquationFromImage } from "@/ai/flows/extract-equation-from-image";
import { correctEquationMistakes } from "@/ai/flows/correct-equation-mistakes";
import { solveEquation } from "@/ai/flows/solve-equation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export default function DrawTab() {
  const canvasRef = useRef<CanvasRef>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [correctedText, setCorrectedText] = useState<string | null>(null);
  const [solution, setSolution] = useState<string[] | null>(null);

  const handleSolve = async () => {
    if (!canvasRef.current) return;
    const imageDataUrl = canvasRef.current.getDataURL();
    if (!imageDataUrl) {
      toast({
        title: "Error",
        description: "Could not get image from canvas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ocrResult = await extractEquationFromImage({ photoDataUri: imageDataUrl });
      setOcrText(ocrResult.ocrText);
      
      const correctedResult = await correctEquationMistakes({ ocrText: ocrResult.ocrText });
      setCorrectedText(correctedResult.correctedText);

      const solveResult = await solveEquation({ ocrText: correctedResult.correctedText });
      setSolution(solveResult.solvedResult);

      if (user) {
        const storageRef = ref(storage, `equations/${user.uid}/${Date.now()}.png`);
        const uploadResult = await uploadString(storageRef, imageDataUrl, 'data_url');
        const downloadURL = await getDownloadURL(uploadResult.ref);

        await addDoc(collection(db, "equations"), {
          userId: user.uid,
          ocrText: ocrResult.ocrText,
          correctedText: correctedResult.correctedText,
          solvedResult: solveResult.solvedResult,
          imageUrl: downloadURL,
          createdAt: serverTimestamp(),
        });

        toast({
          title: "Success!",
          description: "Equation solved and saved to your history.",
        });
      } else {
         toast({
          title: "Equation Solved",
          description: "Log in to save your results to history.",
        });
      }
    } catch (e: any) {
      console.error(e);
      setError("An error occurred while solving the equation. The AI might not be able to solve this equation yet.");
      toast({
        title: "Solving Error",
        description: "Please try a different equation or check the image quality.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draw Equation</CardTitle>
        <CardDescription>Draw a handwritten equation on the canvas below and let AI solve it for you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
            <Canvas ref={canvasRef} />
        </div>
        <div className="flex justify-center">
            <Button onClick={handleSolve} disabled={isLoading} size="lg">
                <BrainCircuit className="mr-2 h-5 w-5" />
                {isLoading ? "Solving..." : "Solve Drawn Equation"}
            </Button>
        </div>
        <EquationResult 
          isLoading={isLoading}
          error={error}
          ocrText={ocrText}
          correctedText={correctedText}
          solution={solution}
        />
      </CardContent>
    </Card>
  );
}
