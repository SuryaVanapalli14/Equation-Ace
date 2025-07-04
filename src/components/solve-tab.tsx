"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UploadCloud, BrainCircuit, Trash2, Pencil, GalleryHorizontal, Keyboard } from "lucide-react";
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

import { solveEquation, type SolveEquationInput } from "@/ai/flows/solve-equation";
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [inputImageDataUrl, setInputImageDataUrl] = useState<string | null>(null);

  // --- AI & Result State ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [correctedText, setCorrectedText] = useState<string | null>(null);
  const [solution, setSolution] = useState<string[] | null>(null);
  const [explanation, setExplanation] = useState<string[] | null>(null);
  const [graphData, setGraphData] = useState<{ isPlottable: boolean; functionStr?: string; } | null>(null);


  const resetResults = () => {
    setOcrText(null);
    setCorrectedText(null);
    setSolution(null);
    setError(null);
    setExplanation(null);
    setGraphData(null);
    setInputImageDataUrl(null);
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
    if (!navigator.onLine) {
      toast({
        variant: "destructive",
        title: "You're Offline",
        description: "An internet connection is required to get a solution.",
      });
      return;
    }

    let input: SolveEquationInput = {};
    let currentImageDataUrl: string | null = null;
    let isTextOnly = false;

    if (textInput.trim()) {
      input.problemStatement = textInput.trim();
      isTextOnly = true;
    } else if (file && originalImageUrl && imgRef.current && completedCrop && completedCrop.width > 0) {
      currentImageDataUrl = await getCroppedDataUrl(imgRef.current, completedCrop);
      input.photoDataUri = currentImageDataUrl;
    } else if (isDrawing && canvasRef.current) {
      currentImageDataUrl = canvasRef.current.getDataURL();
      input.photoDataUri = currentImageDataUrl;
    }

    if (!input.problemStatement && !input.photoDataUri) {
      toast({ title: "No Input Provided", description: "Please upload an image, draw, or type in a problem.", variant: "destructive" });
      return;
    }
    
    resetResults();
    setIsLoading(true);
    setInputImageDataUrl(currentImageDataUrl);

    try {
      const solveResult = await solveEquation(input);
      
      setOcrText(solveResult.ocrText ?? (isTextOnly ? textInput.trim() : null));
      setCorrectedText(solveResult.correctedText);
      setSolution(solveResult.solvedResult);
      setExplanation(solveResult.explanation);
      setGraphData(solveResult.graphData?.isPlottable ? solveResult.graphData : null);

      if (user && db && storage && currentImageDataUrl) {
          const storageRef = ref(storage, `equations/${user.uid}/${Date.now()}.png`);
          await uploadString(storageRef, currentImageDataUrl, 'data_url');
          const downloadURL = await getDownloadURL(storageRef);

          await addDoc(collection(db, "equations"), {
            userId: user.uid,
            ocrText: solveResult.ocrText || 'N/A',
            correctedText: solveResult.correctedText,
            solvedResult: solveResult.solvedResult,
            explanation: solveResult.explanation,
            imageUrl: downloadURL,
            createdAt: serverTimestamp(),
            graphData: solveResult.graphData ?? null,
          });
          toast({ title: "Success!", description: "Equation solved and saved to your history." });
      } else if (isTextOnly) {
        toast({ title: "Equation Solved", description: "Text-only solutions are not saved to history." });
      } else {
         toast({ title: "Equation Solved", description: "Log in to save your results to history." });
      }
    } catch (e: any) {
      console.error(e);
      setError("An error occurred while solving the equation. The AI may not be able to process this request.");
      toast({ title: "Solving Error", description: "Could not solve the equation. Please try a different problem.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const canSolve = !!file || isDrawing || !!textInput.trim();

  return (
    <Card className="animate-in fade-in-0 duration-500 transition-shadow hover:shadow-lg hover:shadow-primary/20">
      <CardHeader>
        <CardTitle>Let's solve your problem</CardTitle>
        <CardDescription>Upload an image, draw, or type a problem, then let AI solve it for you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Upload & Text */}
          <div className="flex flex-col gap-8 h-full">
            <div className="flex flex-col items-center space-y-4 border p-4 rounded-lg flex-1 bg-background transition-colors hover:border-primary">
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
                  <div className={cn("flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg border-muted hover:border-primary transition-colors", isDragging && "border-primary bg-accent/10")}>
                    <UploadCloud className="w-8 h-8 text-muted-foreground" />
                    <span className="mt-2 text-sm text-muted-foreground">Click or drag and drop</span>
                    <span className="text-xs text-muted-foreground">PNG or JPG</span>
                  </div>
                  <Input ref={fileInputRef} id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" />
                </label>
              ) : (
                <>
                  <div className="p-2 border rounded-lg bg-muted/20 w-full">
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

            <div className="flex flex-col items-center space-y-4 border p-4 rounded-lg flex-1 bg-background transition-colors hover:border-primary">
              <h3 className="text-lg font-medium flex items-center justify-center gap-2">
                <Keyboard className="w-5 h-5"/> Or Type-in here
              </h3>
              <Textarea 
                placeholder="Type your math problem or equation here... For example: 'If a train travels at 60 mph for 3 hours, how far does it travel?' or 'd/dx(sin(x^2))'"
                value={textInput}
                onChange={handleTextInputChange}
                rows={6}
                className="w-full h-full"
              />
            </div>
          </div>
          
          {/* Right Column: Draw */}
          <div className="flex flex-col items-center space-y-4 border p-4 rounded-lg h-full bg-background transition-colors hover:border-primary">
            <h3 className="text-lg font-medium flex items-center gap-2"><Pencil className="w-5 h-5"/> Draw on Canvas</h3>
            <Canvas ref={canvasRef} onInteraction={handleCanvasInteraction} />
          </div>

        </div>

        <div className="flex flex-col items-center space-y-6 pt-6 border-t">
          <Button onClick={handleInitiateSolve} disabled={!canSolve || isLoading} size="lg">
            <BrainCircuit className="mr-2 h-5 w-5" />
            {isLoading ? "Processing..." : "Get Solution"}
          </Button>
          
          <div className="w-full max-w-4xl">
            <EquationResult 
              isLoading={isLoading}
              error={error}
              ocrText={ocrText}
              correctedText={correctedText}
              solution={solution}
              explanation={explanation}
              graphData={graphData}
              inputImageDataUrl={inputImageDataUrl}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
