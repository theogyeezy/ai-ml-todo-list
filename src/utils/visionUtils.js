import { createWorker } from 'tesseract.js';
import { categorizeTask, predictPriority, analyzeSentiment, estimateTime } from './aiHelpers';

let worker = null;

export const initializeOCR = async () => {
  if (!worker) {
    worker = await createWorker('eng');
  }
  return worker;
};

export const extractTextFromImage = async (imageFile) => {
  try {
    if (!worker) {
      await initializeOCR();
    }
    
    const { data: { text } } = await worker.recognize(imageFile);
    return text.trim();
  } catch (error) {
    console.error('Error extracting text from image:', error);
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

export const captureImageFromCamera = () => {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment', // Use back camera if available
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    })
    .then(stream => {
      resolve(stream);
    })
    .catch(error => {
      console.error('Error accessing camera:', error);
      reject(new Error('Camera access denied or unavailable'));
    });
  });
};

export const stopCameraStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};

export const capturePhotoFromStream = (videoElement) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    context.drawImage(videoElement, 0, 0);
    
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.8);
  });
};