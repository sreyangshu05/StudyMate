// Import the library implementation directly to avoid the package's debug index.js
import pdfImpl from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PDFService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../uploads');
    this.ensureUploadsDir();
  }

  ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdf = pdfImpl.default || pdfImpl;
      const data = await pdf(dataBuffer);
      return {
        text: data.text,
        pages: data.numpages,
        info: data.info
      };
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  async savePDF(file, userId) {
    try {
      const filename = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(this.uploadsDir, filename);
      
      await fs.promises.writeFile(filePath, file.buffer);
      
      return {
        filename,
        filePath,
        originalName: file.originalname
      };
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw new Error('Failed to save PDF file');
    }
  }

  chunkText(text, chunkSize = 500, overlap = 100) {
    const words = text.split(/\s+/);
    const chunks = [];
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 0) {
        chunks.push({
          text: chunk.trim(),
          startIndex: i,
          endIndex: Math.min(i + chunkSize, words.length)
        });
      }
    }
    
    return chunks;
  }

  estimatePageNumber(textPosition, totalText, totalPages) {
    // Simple estimation based on text position
    const ratio = textPosition / totalText.length;
    return Math.ceil(ratio * totalPages);
  }

  async processPDF(filePath, docId, totalPages) {
    try {
      const { text } = await this.extractTextFromPDF(filePath);
      const chunks = this.chunkText(text);
      
      const processedChunks = chunks.map((chunk, index) => ({
        doc_id: docId,
        page_no: this.estimatePageNumber(chunk.startIndex, text, totalPages),
        text: chunk.text,
        chunk_id: index + 1
      }));

      return processedChunks;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error('Failed to process PDF');
    }
  }
}
