'use server';
/**
 * @fileOverview Corrects and solves a math problem from OCR text in a single step.
 *
 * - solveEquation - A function that takes OCR text, corrects it, solves it, and returns the results.
 * - SolveEquationInput - The input type for the solveEquation function.
 * - SolveEquationOutput - The return type for the solveEquation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SolveEquationInputSchema = z.object({
  ocrText: z.string().describe('The OCR extracted text of the math problem.'),
});
export type SolveEquationInput = z.infer<typeof SolveEquationInputSchema>;

const SolveEquationOutputSchema = z.object({
  correctedText: z.string().describe('The corrected version of the problem text.'),
  solvedResult: z
    .array(z.string())
    .describe('The final solved result of the problem.'),
  explanation: z
    .array(z.string())
    .describe('A step-by-step explanation of how the solution was reached.'),
  graphData: z.object({
    isPlottable: z.boolean().describe('Whether the result is a plottable 2D function.'),
    functionStr: z.string().optional().describe("If plottable, the function expression to be plotted (e.g., 'x^2 + 3*x - 4'). Do not include 'y =' or 'f(x) ='.")
  }).optional().describe('Data for visualizing the equation if it is plottable.'),
});
export type SolveEquationOutput = z.infer<typeof SolveEquationOutputSchema>;

export async function solveEquation(input: SolveEquationInput): Promise<SolveEquationOutput> {
  return solveEquationFlow(input);
}

const solveEquationPrompt = ai.definePrompt({
  name: 'solveEquationPrompt',
  input: {schema: SolveEquationInputSchema},
  output: {schema: SolveEquationOutputSchema},
  prompt: `You are an expert AI mathematician and OCR correction specialist. You will be given OCR text that might contain a word problem, a direct equation, or a mix of both. The text may have common OCR errors.

Your task is to perform two steps:
1.  **Correct the OCR Text:** First, silently correct any common OCR mistakes in the provided text. This includes, but is not limited to:
    - Correcting mistakes in both the natural language parts of the problem and the mathematical expressions.
    - Misinterpreting 'O' as '0', 'l' as '1', 'S' as '5' or '∫'.
    - Fixing malformed text for calculus, like 'd/dx', 'dy/dx', or '∫'.
    - Recognizing probability and statistics notation, like 'P(A)', 'nCr', 'Σ', or '!'.
    - Correcting exponents, like 'x^2' instead of 'x2'.
    - Ensuring standard mathematical operators (+, -, *, /) are correctly represented.
    Once corrected, provide this clean version in the 'correctedText' output field.

2.  **Solve the Corrected Problem:** Using the corrected text from step 1, solve the problem. Your capabilities should cover:
    - **Word Problems:** Parsing and solving problems described in natural language.
    - **Algebra:** Solving for variables, simplifying expressions, systems of equations.
    - **Calculus:** Differentiation, integration, limits, series.
    - **Probability:** Calculating probabilities.
    - **Statistics:** Mean, median, mode, permutations, combinations, factorials, summation.

Provide the final solved result. Also, provide a detailed, step-by-step explanation for how you arrived at the solution.

If the problem results in a plottable 2D function (e.g., y = 3x + 2, f(x) = x^2 - 5), set graphData.isPlottable to true and provide the function expression as a string in graphData.functionStr (e.g., '3*x + 2' or 'x^2 - 5'). Otherwise, set graphData.isPlottable to false.

Original OCR Text: {{{ocrText}}}`,
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
