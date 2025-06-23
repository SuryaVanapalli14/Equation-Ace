'use server';
/**
 * @fileOverview Solves a math equation extracted from an image using OCR.
 *
 * - solveEquation - A function that takes OCR text as input and returns the solved equation.
 * - SolveEquationInput - The input type for the solveEquation function.
 * - SolveEquationOutput - The return type for the solveEquation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SolveEquationInputSchema = z.object({
  ocrText: z.string().describe('The OCR extracted text of the handwritten equation.'),
});
export type SolveEquationInput = z.infer<typeof SolveEquationInputSchema>;

const SolveEquationOutputSchema = z.object({
  solvedResult: z.array(z.string()).describe('The solved result of the equation.'),
});
export type SolveEquationOutput = z.infer<typeof SolveEquationOutputSchema>;

export async function solveEquation(input: SolveEquationInput): Promise<SolveEquationOutput> {
  return solveEquationFlow(input);
}

const solveEquationPrompt = ai.definePrompt({
  name: 'solveEquationPrompt',
  input: {schema: SolveEquationInputSchema},
  output: {schema: SolveEquationOutputSchema},
  prompt: `You are an AI equation solver.  You will be given the OCR output of a handwritten equation.  Solve the equation and return the result.

OCR Text: {{{ocrText}}}`,
});

const solveEquationFlow = ai.defineFlow(
  {
    name: 'solveEquationFlow',
    inputSchema: SolveEquationInputSchema,
    outputSchema: SolveEquationOutputSchema,
  },
  async input => {
    const {output} = await solveEquationPrompt(input);
    return output!;
  }
);
