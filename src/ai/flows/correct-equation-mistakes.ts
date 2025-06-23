'use server';

/**
 * @fileOverview A flow for correcting common OCR mistakes in handwritten equations.
 *
 * - correctEquationMistakes - A function that corrects mistakes in an equation string.
 * - CorrectEquationMistakesInput - The input type for the correctEquationMistakes function.
 * - CorrectEquationMistakesOutput - The return type for the correctEquationMistakes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectEquationMistakesInputSchema = z.object({
  ocrText: z.string().describe('The OCR output of a handwritten equation.'),
});
export type CorrectEquationMistakesInput = z.infer<typeof CorrectEquationMistakesInputSchema>;

const CorrectEquationMistakesOutputSchema = z.object({
  correctedText: z.string().describe('The corrected equation text.'),
});
export type CorrectEquationMistakesOutput = z.infer<typeof CorrectEquationMistakesOutputSchema>;

export async function correctEquationMistakes(input: CorrectEquationMistakesInput): Promise<CorrectEquationMistakesOutput> {
  return correctEquationMistakesFlow(input);
}

const correctEquationMistakesPrompt = ai.definePrompt({
  name: 'correctEquationMistakesPrompt',
  input: {schema: CorrectEquationMistakesInputSchema},
  output: {schema: CorrectEquationMistakesOutputSchema},
  prompt: `You are an expert in correcting common OCR mistakes in handwritten math equations.

You will receive the OCR output of a handwritten equation. Your task is to correct common mistakes, such as misinterpreting 'O' as '0' or '^' as '**'.

Original OCR Text: {{{ocrText}}}

Corrected Equation Text:`, // Ensure output only contains the corrected equation
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
