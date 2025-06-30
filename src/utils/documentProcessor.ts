import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { DocumentPage } from '../types';

// Set up PDF.js worker - use the bundled worker instead of CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

export class DocumentProcessor {
  /**
   * Process a PDF file and convert each page to an image
   */
  static async processPDF(file: File): Promise<{ textContent: string; pages: DocumentPage[] }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const pages: DocumentPage[] = [];
      let fullTextContent = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // Extract text content
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullTextContent += `Page ${pageNum}:\n${pageText}\n\n`;
        
        // Render page to canvas and convert to image
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to base64 image
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = imageBase64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        
        pages.push({
          pageNumber: pageNum,
          imageBase64: base64Data,
          textContent: pageText
        });
      }
      
      return {
        textContent: fullTextContent,
        pages
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Process a text-based document (MD, TXT, etc.)
   */
  static async processTextDocument(file: File): Promise<string> {
    try {
      return await file.text();
    } catch (error) {
      console.error('Error processing text document:', error);
      throw new Error(`Failed to process text document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Process various document types
   */
  static async processDocument(file: File): Promise<{ textContent: string; pages?: DocumentPage[] }> {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    switch (fileExt) {
      case 'pdf':
        return await this.processPDF(file);
      
      case 'md':
      case 'txt':
      case 'json':
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'py':
      case 'html':
      case 'css':
      case 'xml':
      case 'csv':
        const textContent = await this.processTextDocument(file);
        return { textContent };
      
      default:
        throw new Error(`Unsupported file type: ${fileExt}`);
    }
  }
  
  /**
   * Check if a file type is supported for document processing
   */
  static isSupportedDocument(file: File): boolean {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const supportedExtensions = [
      'pdf', 'md', 'txt', 'json', 'js', 'jsx', 'ts', 'tsx', 
      'py', 'html', 'css', 'xml', 'csv'
    ];
    
    return supportedExtensions.includes(fileExt || '');
  }
}