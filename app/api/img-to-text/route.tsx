import { imageToText } from '@/lib/imageToText';
import { NextResponse } from 'next/server';
  
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const allNotes = [];
    
    // Process each image individually to avoid AI context confusion
    for (const file of files) {
      try {
        const note = await imageToText(file);
        allNotes.push(note);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Continue processing other files even if one fails
        allNotes.push({
          title: `Failed to transcribe ${file.name}`,
          content: "Error processing this image"
        });
      }
    }
    
    return NextResponse.json({ notes: allNotes });
  } catch (error) {
    console.error('Error processing images:', error);
    return NextResponse.json({ error: 'Failed to process images' }, { status: 500 });
  }
}