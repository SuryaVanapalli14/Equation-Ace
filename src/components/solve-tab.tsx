"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { UploadCloud, BrainCircuit, Check, X, Trash2, Pencil, GalleryHorizontal, Keyboard } from "lucide-react";
import EquationResult from "./equation-result";
import Canvas, { type CanvasRef } from "./canvas";
import { Textarea } from "@/components/ui/textarea";

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
import { cn } from "@/lib/utils";

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
        width: 100,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function SolveTab() {
  const { user } = useAuth();
  const { toast } = useToast();

  // --- Refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<CanvasRef>(null);

  // --- Input State ---
  const [file, setFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [textInput, setTextInput] = useState("");
  const [activeInput, setActiveInput] = useState<'upload' | 'draw' | 'text' | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- AI & Result State ---
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [correctedText, setCorrectedText] = useState<string | null>(null);
  const [solution, setSolution] = useState<string[] | null>(null);
  const [explanation, setExplanation] = useState<string[] | null>(null);

  const resetResults = () => {
    setOcrText(null);
    setCorrectedText(null);
    setSolution(null);
    setError(null);
    setExplanation(null);
  };

  const handleRemoveImage = () => {
    setFile(null);
    setOriginalImageUrl(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    resetResults();
  };
  
  // --- File & Upload Handlers ---
  const processFile = (selectedFile: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (selectedFile && validTypes.includes(selectedFile.type)) {
      canvasRef.current?.clear();
      setIsDrawing(false);
      setTextInput("");
      
      setFile(selectedFile);
      setCrop(undefined);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImageUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      resetResults();
    } else {
      toast({ title: "Invalid File Type", description: "Please upload a PNG or JPG file.", variant: "destructive" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, width / height));
  }

  // --- Drawing Handlers ---
  const handleCanvasInteraction = () => {
    if (!isDrawing) {
      setIsDrawing(true);
      if (file) handleRemoveImage();
      if (textInput) setTextInput("");
      resetResults();
    }
  };

  // --- Text Input ---
  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    if(e.target.value.length > 0) {
        if(file) handleRemoveImage();
        if(isDrawing) {
            canvasRef.current?.clear();
            setIsDrawing(false);
        }
        resetResults();
    }
  };

  // --- Solving Logic ---
  async function getCroppedDataUrl(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
    return canvas.toDataURL('image/png');
  }

  const handleInitiateSolve = async () => {
    let imageDataUrl: string | null = null;
    let source: 'upload' | 'draw' | 'text' | null = null;
    let problemToSolve: string | null = null;

    if (textInput.trim()) {
      problemToSolve = textInput.trim();
      source = 'text';
    } else if (file && originalImageUrl && imgRef.current && completedCrop && completedCrop.width > 0) {
      imageDataUrl = await getCroppedDataUrl(imgRef.current, completedCrop);
      source = 'upload';
    } else if (isDrawing && canvasRef.current) {
      imageDataUrl = canvasRef.current.getDataURL();
      source = 'draw';
    }

    if (!source) {
      toast({ title: "No Input Provided", description: "Please upload an image, draw, or type in a problem.", variant: "destructive" });
      return;
    }
    
    setActiveInput(source);
    setIsLoading(true);
    resetResults();

    try {
      if (source === 'text') {
        setOcrText(problemToSolve);
        setIsConfirming(true);
      } else if (imageDataUrl) {
        const ocrResult = await extractEquationFromImage({ photoDataUri: imageDataUrl });
        
        if (!ocrResult.ocrText.trim()) {
          const message = source === 'draw' ? "The canvas is empty. Please draw an equation." : "Could not find any text in the selected area.";
          toast({ title: "Nothing to solve", description: message, variant: "destructive" });
          setIsLoading(false);
          return;
        }
        setOcrText(ocrResult.ocrText);
        setIsConfirming(true);
      }
    } catch (e: any) {
      console.error(e);
      setError("An error occurred while extracting text from the image.");
      toast({ title: "Extraction Error", description: "Could not read text from the image. Please try again.", variant: "destructive" });
      setIsLoading(false);
    }
  };
  
  const handleConfirmSolve = async () => {
    if (!ocrText) return;
    setIsConfirming(false);

    try {
      const correctedResult = await correctEquationMistakes({ ocrText });
      setCorrectedText(correctedResult.correctedText);

      const solveResult = await solveEquation({ ocrText: correctedResult.correctedText });
      setSolution(solveResult.solvedResult);
      setExplanation(solveResult.explanation);
      
      if (user && db && storage) {
        let finalImageDataUrl: string | null = null;
        if (activeInput === 'upload' && imgRef.current && completedCrop) {
          finalImageDataUrl = await getCroppedDataUrl(imgRef.current, completedCrop);
        } else if (activeInput === 'draw' && canvasRef.current) {
          finalImageDataUrl = canvasRef.current.getDataURL();
        } else if (activeInput === 'text') {
          // No image to save for text input, or we can generate one. For now, let's not.
        }
        
        if(finalImageDataUrl) {
          const storageRef = ref(storage, `equations/${user.uid}/${Date.now()}.png`);
          await uploadString(storageRef, finalImageDataUrl, 'data_url');
          const downloadURL = await getDownloadURL(storageRef);

          await addDoc(collection(db, "equations"), {
            userId: user.uid,
            ocrText: ocrText,
            correctedText: correctedResult.correctedText,
            solvedResult: solveResult.solvedResult,
            explanation: solveResult.explanation,
            imageUrl: downloadURL,
            createdAt: serverTimestamp(),
          });
          toast({ title: "Success!", description: "Equation solved and saved to your history." });
        } else {
          // Handle saving text-only solutions if desired, maybe without an image URL
           toast({ title: "Equation Solved", description: "Log in to save your results to history." });
        }
      } else {
         toast({ title: "Equation Solved", description: "Log in to save your results to history." });
      }
    } catch (e: any) {
      console.error(e);
      setError("An error occurred while solving the equation.");
      toast({ title: "Solving Error", description: "The AI might not be able to solve this problem yet.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSolve = () => {
    setIsConfirming(false);
    setOcrText(null);
    setIsLoading(false);
  };
  
  const canSolve = !!file || isDrawing || !!textInput.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solve a Math Problem</CardTitle>
        <CardDescription>Upload an image, draw, or type a problem, then let AI solve it for you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Upload */}
          <div className="flex flex-col items-center space-y-4 border p-4 rounded-lg h-full">
            <h3 className="text-lg font-medium flex items-center gap-2"><GalleryHorizontal className="w-5 h-5"/> Upload an Image</h3>
            {!originalImageUrl ? (
              <label
                htmlFor="file-upload"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="w-full cursor-pointer"
              >
                <div className={cn("flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg border-muted hover:border-primary transition-colors", isDragging && "border-primary bg-accent/50")}>
                  <UploadCloud className="w-8 h-8 text-muted-foreground" />
                  <span className="mt-2 text-sm text-muted-foreground">Click or drag and drop</span>
                  <span className="text-xs text-muted-foreground">PNG or JPG</span>
                </div>
                <Input ref={fileInputRef} id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" />
              </label>
            ) : (
              <>
                <div className="p-2 border rounded-lg bg-muted w-full">
                  <ReactCrop crop={crop} onChange={(_, pc) => setCrop(pc)} onComplete={(c) => setCompletedCrop(c)} minHeight={50}>
                    <img ref={imgRef} alt="Crop this image" data-ai-hint="mathematical equation" src={originalImageUrl} onLoad={onImageLoad} className="w-full" />
                  </ReactCrop>
                </div>
                <Button variant="outline" onClick={handleRemoveImage} size="sm">
                  <Trash2 className="mr-2 h-4 w-4" /> Remove Image
                </Button>
              </>
            )}
          </div>
          
          {/* Right Column: Draw */}
          <div className="flex flex-col items-center space-y-4 border p-4 rounded-lg h-full min-h-[350px]">
            <h3 className="text-lg font-medium flex items-center gap-2"><Pencil className="w-5 h-5"/> Or Draw It</h3>
            <Canvas ref={canvasRef} onInteraction={handleCanvasInteraction} />
          </div>

        </div>
        
        {/* Text Input */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-medium text-center mb-4 flex items-center justify-center gap-2">
            <Keyboard className="w-5 h-5"/> Or Type it Manually
          </h3>
          <Textarea 
            placeholder="Type your math problem or equation here... For example: 'If a train travels at 60 mph for 3 hours, how far does it travel?' or 'd/dx(sin(x^2))'"
            value={textInput}
            onChange={handleTextInputChange}
            rows={4}
            className="max-w-4xl mx-auto"
          />
        </div>

        <div className="flex flex-col items-center space-y-6 pt-6 border-t">
          <Button onClick={handleInitiateSolve} disabled={!canSolve || isLoading} size="lg">
            <BrainCircuit className="mr-2 h-5 w-5" />
            {isLoading ? "Processing..." : "Solve Problem"}
          </Button>
          
          <div className="w-full max-w-4xl">
            <EquationResult 
              isLoading={isLoading && !isConfirming}
              error={error}
              ocrText={ocrText}
              correctedText={correctedText}
              solution={solution}
              explanation={explanation}
            />
          </div>
        </div>
        
        <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Extracted Text</AlertDialogTitle>
              <AlertDialogDescription>Please review and edit the extracted text if needed before solving.</AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea value={ocrText || ""} onChange={(e) => setOcrText(e.target.value)} className="font-code text-lg min-h-[120px]" />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelSolve}><X className="mr-2 h-4 w-4" />Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSolve}><Check className="mr-2 h-4 w-4" />Confirm & Solve</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
