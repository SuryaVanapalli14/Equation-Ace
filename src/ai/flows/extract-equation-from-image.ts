'use server';
/**
 * @fileOverview Extracts a mathematical problem from an image using OCR.
 *
 * - extractEquationFromImage - A function that handles the problem extraction process.
 * - ExtractEquationFromImageInput - The input type for the extractEquationFromImage function.
 * - ExtractEquationFromImageOutput - The return type for the extractEquationFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractEquationFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a mathematical problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractEquationFromImageInput = z.infer<typeof ExtractEquationFromImageInputSchema>;

const ExtractEquationFromImageOutputSchema = z.object({
  ocrText: z
    .string()
    .describe('The extracted text from the image, representing the problem.'),
});
export type ExtractEquationFromImageOutput = z.infer<typeof ExtractEquationFromImageOutputSchema>;

export async function extractEquationFromImage(
  input: ExtractEquationFromImageInput
): Promise<ExtractEquationFromImageOutput> {
  return extractEquationFromImageFlow(input);
}

const extractEquationFromImagePrompt = ai.definePrompt({
  name: 'extractEquationFromImagePrompt',
  input: {schema: ExtractEquationFromImageInputSchema},
  output: {schema: ExtractEquationFromImageOutputSchema},
  prompt: `You are an OCR expert. Extract all relevant text from the image to solve a mathematical problem. The problem could be a word problem, a standalone equation, or a mix of both. The text could be handwritten or digitally typed. Preserve the original formatting as much as possible.

Image: {{media url=photoDataUri}}`,
});

const extractEquationFromImageFlow = ai.defineFlow(
  {
    name: 'extractEquationFromImageFlow',
    inputSchema: ExtractEquationFromImageInputSchema,
    outputSchema: ExtractEquationFromImageOutputSchema,
  },
  async input => {
    const {output} = await extractEquationFromImagePrompt(input);
    return output!;
  }
);
