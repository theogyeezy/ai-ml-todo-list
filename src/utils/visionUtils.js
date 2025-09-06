import { createWorker } from 'tesseract.js';
import { categorizeTask, predictPriority, analyzeSentiment, estimateTime } from './aiHelpers';

let worker = null;

export const initializeOCR = async () => {
  if (!worker) {
    worker = await createWorker('eng');
  }
  return worker;
};

// Preprocess image for better OCR accuracy
const preprocessImage = (imageFile) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        
        // Increase contrast (simple threshold)
        const threshold = gray > 128 ? 255 : 0;
        
        data[i] = threshold;     // Red
        data[i + 1] = threshold; // Green  
        data[i + 2] = threshold; // Blue
        // Alpha channel stays the same
      }
      
      // Put processed image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to blob
      canvas.toBlob(resolve, 'image/png');
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
};

export const extractTextFromImage = async (imageFile, usePreprocessing = true) => {
  try {
    if (!worker) {
      await initializeOCR();
    }
    
    let processedImage = imageFile;
    
    if (usePreprocessing) {
      console.log('Preprocessing image for better OCR...');
      processedImage = await preprocessImage(imageFile);
    }
    
    // Configure Tesseract for better handwriting recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?-',
      tessedit_pageseg_mode: '6', // Uniform block of text
      preserve_interword_spaces: '1'
    });
    
    const { data: { text, confidence } } = await worker.recognize(processedImage);
    console.log(`OCR confidence: ${confidence}%`);
    
    if (confidence < 30) {
      throw new Error('LOW_CONFIDENCE');
    }
    
    return text.trim();
  } catch (error) {
    console.error('Error extracting text from image:', error);
    
    if (error.message === 'LOW_CONFIDENCE') {
      throw new Error('The image quality is too low for accurate text recognition. Try with better lighting or clearer handwriting.');
    }
    
    throw new Error('Failed to extract text from image');
  }
};

export const parseTextToTodos = async (text) => {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Split by common separators and clean up
  const lines = text
    .split(/[\n\r•\-*\d+.)\]}]/)
    .map(line => line.trim())
    .filter(line => line.length > 2)
    .filter(line => !line.match(/^[^a-zA-Z]*$/)); // Remove lines with only numbers/symbols

  // Additional parsing for common todo formats
  const todoItems = [];
  
  for (let line of lines) {
    // Remove common prefixes like "- ", "* ", "1. ", etc.
    line = line.replace(/^[-*+\d+.)\]}\s]*/, '').trim();
    
    // Skip very short lines or lines that look like headers
    if (line.length < 3 || line.match(/^[A-Z\s]+$/)) {
      continue;
    }
    
    // Clean up common OCR artifacts
    line = line.replace(/[|{}[\]]/g, '').trim();
    
    if (line) {
      // Analyze each todo item with AI immediately
      const priority = predictPriority(line);
      const sentiment = analyzeSentiment(line);
      const timeEstimate = estimateTime(line);
      let category = 'Personal';
      
      try {
        category = await categorizeTask(line);
      } catch (error) {
        console.log('Could not categorize with AI, using default');
      }
      
      todoItems.push({
        text: line,
        category,
        priority,
        sentiment,
        timeEstimate,
        isAnalyzed: true
      });
    }
  }

  return todoItems.slice(0, 10); // Limit to 10 todos max
};

// Camera functions removed - using file upload only