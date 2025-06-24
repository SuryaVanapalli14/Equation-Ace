'use server';
/**
 * @fileOverview Solves a math equation, including algebraic, differential, and integral equations, from OCR text.
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
  prompt: `You are an expert AI mathematician. You will be given the OCR output of a handwritten equation. Your task is to solve the equation. This can include algebraic equations, as well as calculus problems like differentiation (e.g., dy/dx) and integration (e.g., ∫f(x)dx). Provide the solved result.

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
