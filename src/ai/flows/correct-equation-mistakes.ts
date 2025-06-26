'use server';

/**
 * @fileOverview A flow for correcting common OCR mistakes in mathematical problems.
 *
 * - correctEquationMistakes - A function that corrects mistakes in a problem string.
 * - CorrectEquationMistakesInput - The input type for the correctEquationMistakes function.
 * - CorrectEquationMistakesOutput - The return type for the correctEquationMistakes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectEquationMistakesInputSchema = z.object({
  ocrText: z.string().describe('The OCR output of a mathematical problem.'),
});
export type CorrectEquationMistakesInput = z.infer<typeof CorrectEquationMistakesInputSchema>;

const CorrectEquationMistakesOutputSchema = z.object({
  correctedText: z.string().describe('The corrected problem text.'),
});
export type CorrectEquationMistakesOutput = z.infer<typeof CorrectEquationMistakesOutputSchema>;

export async function correctEquationMistakes(input: CorrectEquationMistakesInput): Promise<CorrectEquationMistakesOutput> {
  return correctEquationMistakesFlow(input);
}

const correctEquationMistakesPrompt = ai.definePrompt({
  name: 'correctEquationMistakesPrompt',
  input: {schema: CorrectEquationMistakesInputSchema},
  output: {schema: CorrectEquationMistakesOutputSchema},
  prompt: `You are an expert in correcting common OCR mistakes in text containing mathematical problems. Your goal is to produce a valid and clear problem statement that can be solved.

You will receive the OCR output of a problem that could be handwritten or digitally typed. Your task is to correct common mistakes. This includes, but is not limited to:
- Correcting mistakes in both the natural language parts of the problem and the mathematical expressions.
- Misinterpreting 'O' as '0', 'l' as '1', 'S' as '5' or '∫'.
- Fixing malformed text for calculus, like 'd/dx', 'dy/dx', or '∫'.
- Recognizing probability and statistics notation, like 'P(A)', 'nCr', 'Σ', or '!'.
- Correcting exponents, like 'x^2' instead of 'x2'.
- Ensuring standard mathematical operators (+, -, *, /) are correctly represented.

Original OCR Text: {{{ocrText}}}

Corrected Problem Text:`,
});

const correctEquationMistakesFlow = ai.defineFlow(
  {
    name: 'correctEquationMistakesFlow',
    inputSchema: CorrectEquationMistakesInputSchema,
    outputSchema: CorrectEquationMistakesOutputSchema,
  },
  async input => {
    const {output} = await correctEquationMistakesPrompt(input);
    return {
      correctedText: output!.correctedText,
    };
  }
);
