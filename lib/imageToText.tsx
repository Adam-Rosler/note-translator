import {
    GoogleGenAI,
    Type,
  } from '@google/genai';

  const prompt = `
  You are an expert transcriber of handwritten notes. Your primary goal is to accurately convert the text from an image of handwritten notes into a clear, well-formatted digital text.
  
  Here are the rules you must follow:
  
  1.  **Accuracy First**: Transcribe all text precisely as it appears in the image. Do not omit any words or phrases.
  2.  **Maintain Formatting**: Replicate the original layout and formatting as closely as possible.
      *   Use bullet points (\`*\` or \`-\`) for lists.
      *   Use arrows (\`->\` or \`$\\rightarrow$\`) as they appear.
      *   Preserve line breaks and paragraph separations.
      *   Maintain indentation where it is clearly present.
  3.  **Grammar and Clarity (Careful Refinement)**:
      *   Correct grammatical errors, spelling mistakes, and punctuation issues
  4.  **No Extraneous Information**: Do not add any commentary, explanations, or information not present in the original notes.
  
  IMPORTANT: Treat the entire image as ONE note. Do not split it into multiple notes or sections. Create ONE title that describes the overall content of the image, and ONE content field with all the transcribed text.
  
  Example Input (mental representation):
  [Image of handwritten notes with bullet points and arrows]
  
  Example Output (desired):
  - This is a bullet point.
  -> An arrow leads to this.
  - Another point.
      - Sub-point.`;

  export interface Note {
    title: string;
    content: string;
  }

  export async function imageToText(image: File): Promise<Note> {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Convert File to base64
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    const contents = [
      {
        inlineData: {
          mimeType: image.type,
          data: base64Image,
        },
      },
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A brief title describing the overall content of the image"
            },
            content: {
              type: Type.STRING,
              description: "The complete transcribed and formatted note content from the entire image"
            }
          },
          propertyOrdering: ["title", "content"],
        },
      },
    });

    try {
      const note = JSON.parse(response.text || '{}');
      return {
        title: note.title || "Transcribed Note",
        content: note.content || ""
      };
    } catch (error) {
      // Fallback to single note if parsing fails
      console.error('Failed to parse structured response, falling back to text:', error);
      return {
        title: "Transcribed Note",
        content: response.text || "Failed to transcribe"
      };
    }
  }
    