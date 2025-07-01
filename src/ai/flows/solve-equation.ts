'use server';
/**
 * @fileOverview Corrects and solves a math problem from OCR text or an image in a single step.
 *
 * - solveEquation - A function that takes a problem as text or an image, and returns the full solution.
 * - SolveEquationInput - The input type for the solveEquation function.
 * - SolveEquationOutput - The return type for the solveEquation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SolveEquationInputSchema = z.object({
  problemStatement: z.string().optional().describe('The math problem as a string. Use this if no image is provided.'),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of a mathematical problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Use this if no text is provided."
    ),
});
export type SolveEquationInput = z.infer<typeof SolveEquationInputSchema>;

const SolveEquationOutputSchema = z.object({
  ocrText: z.string().optional().describe('The text extracted from the image via OCR, before correction. Only present if an image was provided.'),
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
  prompt: `You are an expert AI mathematician and OCR correction specialist.

{{#if photoDataUri}}
You will be given an image containing a math problem. Your task is to perform three steps:
1.  **Perform OCR:** Analyze the provided image and extract all relevant text. The text could be handwritten or digitally typed. Provide this raw, uncorrected extraction in the 'ocrText' output field.
    Image: {{media url=photoDataUri}}
2.  **Correct the OCR Text:** Using the text from step 1, silently correct any common OCR mistakes. This includes, but is not limited to, fixing misinterpretations ('O' for '0', 'l' for '1'), malformed calculus or probability notation, and incorrect exponents. Provide this clean version in the 'correctedText' output field.
3.  **Solve the Corrected Problem:** Using the corrected text, solve the problem.
{{else}}
You will be given a math problem as text, which might contain errors. Your task is to perform two steps:
1.  **Correct the Text:** First, silently correct any common errors in the provided text. Provide this clean version in the 'correctedText' output field.
    Original Problem Text: {{{problemStatement}}}
2.  **Solve the Corrected Problem:** Using the corrected text, solve the problem.
{{/if}}

Your solving capabilities should cover Word Problems, Algebra, Calculus, Probability, and Statistics.

Provide the final solved result. Also, provide a detailed, step-by-step explanation for how you arrived at the solution.

If the problem results in a plottable 2D function (e.g., y = 3x + 2, f(x) = x^2 - 5), set graphData.isPlottable to true and provide the function expression as a string in graphData.functionStr (e.g., '3*x + 2' or 'x^2 - 5'). Otherwise, set graphData.isPlottable to false.
`,
});

const solveEquationFlow = ai.defineFlow(
  {
    name: 'solveEquationFlow',
    inputSchema: SolveEquationInputSchema,
    outputSchema: SolveEquationOutputSchema,
  },
  async input => {
    if (!input.photoDataUri && !input.problemStatement) {
        throw new Error('Either an image or a problem statement must be provided.');
    }
    const {output} = await solveEquationPrompt(input);
    return output!;
  }
);
