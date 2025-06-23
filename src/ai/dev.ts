import { config } from 'dotenv';
config();

import '@/ai/flows/correct-equation-mistakes.ts';
import '@/ai/flows/extract-equation-from-image.ts';
import '@/ai/flows/solve-equation.ts';