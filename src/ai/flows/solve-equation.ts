'use server';
/**
 * @fileOverview Solves a math problem, including word problems, algebraic, differential, and integral equations, from OCR text.
 *
 * - solveEquation - A function that takes OCR text as input and returns the solved equation and a step-by-step explanation.
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
  solvedResult: z
    .array(z.string())
    .describe('The final solved result of the problem.'),
  explanation: z
    .array(z.string())
    .describe('A step-by-step explanation of how the solution was reached.'),
  graphData: z.object({
    isPlottable: z.boolean().describe('Whether the result is a plottable 2D function.'),
    data: z.array(z.object({
      x: z.number(),
      y: z.number()
    })).optional().describe('An array of {x, y} coordinates for plotting the function.')
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
  prompt: `You are an expert AI mathematician with a deep understanding of a wide range of mathematical fields. You will be given OCR text that might contain a word problem, a direct equation, or a mix of both.

Your task is to understand the entire context and solve the problem presented. Your capabilities should cover:
- **Word Problems:** Parsing and solving problems described in natural language.
- **Algebra:** Solving for variables, simplifying expressions, systems of equations.
- **Calculus:**
    - **Differentiation:** Finding derivatives (e.g., d/dx(x^2), f'(x)).
    - **Integration:** Solving definite and indefinite integrals (e.g., ∫(2x)dx).
    - **Limits:** Evaluating limits.
    - **Series:** Calculating sums of series.
- **Probability:** Calculating probabilities of events (e.g., P(A U B), P(A|B)).
- **Statistics:**
    - Calculating mean, median, mode.
    - Permutations and Combinations (nPr, nCr).
    - Problems involving factorials (!).
    - Summation (Σ).

Provide the final solved result. Also, provide a detailed, step-by-step explanation for how you arrived at the solution.

If the problem results in a plottable 2D function (e.g., y = 3x + 2, f(x) = x^2 - 5), set graphData.isPlottable to true and provide an array of at least 20 {x, y} coordinate pairs to visualize the graph. Choose a sensible range for x that shows the key features of the graph (like intercepts or vertices). Otherwise, set graphData.isPlottable to false and do not provide data.

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
