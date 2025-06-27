import type { Timestamp } from 'firebase/firestore';

export interface Equation {
  id: string;
  userId: string;
  ocrText: string;
  correctedText: string;
  solvedResult: string[];
  explanation: string[];
  imageUrl: string;
  createdAt: Timestamp;
  graphData?: {
    isPlottable: boolean;
    data?: { x: number; y: number }[];
  } | null;
}
