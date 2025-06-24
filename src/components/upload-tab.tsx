"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { UploadCloud, BrainCircuit, Check, X } from "lucide-react";
import EquationResult from "./equation-result";

import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


import { extractEquationFromImage } from "@/ai/flows/extract-equation-from-image";
import { correctEquationMistakes } from "@/ai/flows/correct-equation-mistakes";
import { solveEquation } from "@/ai/flows/solve-equation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

// Helper to center the initial crop
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}


export default function UploadTab() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [correctedText, setCorrectedText] = useState<string | null>(null);
  const [solution, setSolution] = useState<string[] | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCrop(undefined) // Reset crop on new image
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImageUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      // Reset results on new file
      setOcrText(null);
      setCorrectedText(null);
      setSolution(null);
      setError(null);
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 16 / 9));
  }

  async function getCroppedDataUrl(
    image: HTMLImageElement,
    crop: PixelCrop,
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );

    return canvas.toDataURL('image/png');
  }


  const handleInitiateSolve = async () => {
    if (!originalImageUrl || !imgRef.current || !completedCrop) {
      toast({
        title: "Error",
        description: "Please upload an image and select a crop area.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setOcrText(null);
    setCorrectedText(null);
    setSolution(null);

    try {
      const croppedDataUrl = await getCroppedDataUrl(imgRef.current, completedCrop);
      const ocrResult = await extractEquationFromImage({ photoDataUri: croppedDataUrl });
      
      setOcrText(ocrResult.ocrText);
      setIsConfirming(true); // Open confirmation dialog

    } catch (e: any) {
      console.error(e);
      setError("An error occurred while extracting the equation from the image.");
      toast({
        title: "Extraction Error",
        description: "Could not read text from the cropped image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSolve = async () => {
    if (!ocrText) return;

    setIsConfirming(false);
    setIsLoading(true);

    try {
      // Pass the confirmed OCR text to the next steps
      const correctedResult = await correctEquationMistakes({ ocrText: ocrText });
      setCorrectedText(correctedResult.correctedText);

      const solveResult = await solveEquation({ ocrText: correctedResult.correctedText });
      setSolution(solveResult.solvedResult);
      
      // Save to history if user is logged in
      if (user && db && storage && file && originalImageUrl && imgRef.current && completedCrop) {
         const croppedDataUrl = await getCroppedDataUrl(imgRef.current, completedCrop);
         const storageRef = ref(storage, `equations/${user.uid}/${Date.now()}_${file.name}`);
         const uploadResult = await uploadString(storageRef, croppedDataUrl, 'data_url');
         const downloadURL = await getDownloadURL(uploadResult.ref);

        await addDoc(collection(db, "equations"), {
          userId: user.uid,
          ocrText: ocrText,
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

  const handleCancelSolve = () => {
    setIsConfirming(false);
    setOcrText(null); // Clear OCR text if cancelled
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Image</CardTitle>
        <CardDescription>Upload, crop, and solve a handwritten equation with AI.</CardDescription>
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

          {originalImageUrl && (
            <div className="p-2 border rounded-lg bg-muted w-full max-w-xl">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={undefined} // Free crop
                minHeight={50}
              >
                <img
                  ref={imgRef}
                  alt="Crop this image"
                  data-ai-hint="handwritten equation"
                  src={originalImageUrl}
                  onLoad={onImageLoad}
                  className="w-full"
                />
              </ReactCrop>
            </div>
          )}
        </div>

        <div className="flex justify-center">
            <Button onClick={handleInitiateSolve} disabled={!file || isLoading} size="lg">
                <BrainCircuit className="mr-2 h-5 w-5" />
                {isLoading ? "Processing..." : "Solve Equation"}
            </Button>
        </div>
        
        <EquationResult 
          isLoading={isLoading && !isConfirming} // Only show skeleton when not in confirmation dialog
          error={error}
          ocrText={ocrText}
          correctedText={correctedText}
          solution={solution}
        />
        
        <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Extracted Equation</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please review the equation extracted from the image. Does this look correct?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="font-code text-xl bg-muted p-4 rounded-md text-center break-all">
                    {ocrText || "..."}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancelSolve}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmSolve}>
                        <Check className="mr-2 h-4 w-4" />
                        Confirm & Solve
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </CardContent>
    </Card>
  );
}
