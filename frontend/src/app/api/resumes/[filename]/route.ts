import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: { filename: string } }
) {
  // Access filename from params
  const filename = context.params.filename;
  
  // Sanitize filename to prevent directory traversal
  const sanitizedFilename = path.basename(filename);
  
  try {
    // Get the absolute path to the PDF file in the public directory
    const filePath = path.join(process.cwd(), 'public', 'resumes', sanitizedFilename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Read the file
    const fileBuffer = await fs.readFile(filePath);
    
    // Create response with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="' + sanitizedFilename + '"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(
      { error: 'Error serving PDF file' },
      { status: 500 }
    );
  }
}
