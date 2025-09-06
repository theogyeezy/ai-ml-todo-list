import { extractTextWithBedrock, extractTextWithBedrockAlternative } from '../services/bedrockVisionService';
import { categorizeTask, predictPriority, analyzeSentiment, estimateTime } from './aiHelpers';

// Bedrock doesn't need initialization like Tesseract
export const initializeOCR = async () => {
  console.log('Using Amazon Bedrock Claude Vision - no initialization needed');
  return true;
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

export const extractTextFromImage = async (imageFile, tryAlternative = false) => {
  try {
    console.log('Extracting text with Amazon Bedrock Claude Vision...');
    
    let extractedText;
    
    if (tryAlternative) {
      // Try with alternative Claude 3.5 Sonnet settings
      extractedText = await extractTextWithBedrockAlternative(imageFile);
    } else {
      // Use Claude 3.5 Sonnet (primary model)
      try {
        extractedText = await extractTextWithBedrock(imageFile);
      } catch (error) {
        console.log('Primary model failed, trying alternative...');
        extractedText = await extractTextWithBedrockAlternative(imageFile);
      }
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text found in the image. The AI vision model could not detect any readable text.');
    }
    
    console.log(`Bedrock extracted text: "${extractedText}"`);
    return extractedText.trim();
    
  } catch (error) {
    console.error('Error extracting text from image:', error);
    
    // Re-throw with user-friendly message
    if (error.message.includes('credentials') || error.message.includes('Access denied')) {
      throw new Error('AWS credentials not configured properly. Please check your Bedrock access.');
    } else if (error.message.includes('model')) {
      throw new Error('AI vision service temporarily unavailable. Please try again in a moment.');
    } else {
      throw error; // Preserve original error message
    }
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