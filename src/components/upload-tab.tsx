"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { UploadCloud, BrainCircuit } from "lucide-react";
import EquationResult from "./equation-result";

import { extractEquationFromImage } from "@/ai/flows/extract-equation-from-image";
import { correctEquationMistakes } from "@/ai/flows/correct-equation-mistakes";
import { solveEquation } from "@/ai/flows/solve-equation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export default function UploadTab() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [correctedText, setCorrectedText] = useState<string | null>(null);
  const [solution, setSolution] = useState<string[] | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      // Reset results on new file
      setOcrText(null);
      setCorrectedText(null);
      setSolution(null);
      setError(null);
    }
  };

  const handleSolve = async () => {
    if (!file || !previewUrl) {
      toast({
        title: "No file selected",
        description: "Please upload an image of an equation first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ocrResult = await extractEquationFromImage({ photoDataUri: previewUrl });
      setOcrText(ocrResult.ocrText);
      
      const correctedResult = await correctEquationMistakes({ ocrText: ocrResult.ocrText });
      setCorrectedText(correctedResult.correctedText);

      const solveResult = await solveEquation({ ocrText: correctedResult.correctedText });
      setSolution(solveResult.solvedResult);

      if (user) {
        const storageRef = ref(storage, `equations/${user.uid}/${Date.now()}_${file.name}`);
        const uploadResult = await uploadString(storageRef, previewUrl, 'data_url');
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
        <CardTitle>Upload Image</CardTitle>
        <CardDescription>Upload an image of a handwritten equation to get it solved by AI.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <label htmlFor="file-upload" className="w-full cursor-pointer">
            <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg border-muted hover:border-primary transition-colors">
                <UploadCloud className="w-8 h-8 text-muted-foreground" />
                <span className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</span>
                <span className="text-xs text-muted-foreground">PNG or JPG</span>
            </div>
            <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg" />
          </label>

          {previewUrl && (
            <div className="p-2 border rounded-lg bg-muted">
              <Image src={previewUrl} alt="Equation preview" width={400} height={150} className="object-contain rounded-md" data-ai-hint="handwritten equation" />
            </div>
          )}
        </div>

        <div className="flex justify-center">
            <Button onClick={handleSolve} disabled={!file || isLoading} size="lg">
                <BrainCircuit className="mr-2 h-5 w-5" />
                {isLoading ? "Solving..." : "Solve Equation"}
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
