import React, { useState, useRef } from 'react';
import { extractTextFromImage, parseTextToTodos } from '../utils/visionUtils';

function ImageUpload({ onTodosExtracted, onClose }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, GIF, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);

    // Process the file
    processImage(file);
  };

  const processImage = async (file) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Extract text from image
      const extractedText = await extractTextFromImage(file);
      
      if (!extractedText || extractedText.trim().length === 0) {
        setError('No text found in the image. Please try with a clearer image.');
        return;
      }

      // Parse text into todo items (with AI analysis)
      const todoItems = await parseTextToTodos(extractedText);
      
      if (todoItems.length === 0) {
        setError('Could not identify any todo items in the text. The text found was: "' + extractedText.substring(0, 100) + '..."');
        return;
      }

      // Pass the extracted todos back to parent
      onTodosExtracted(todoItems);
      
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process the image. Please try again with a different image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-upload-overlay">
      <div className="image-upload-modal">
        <div className="upload-header">
          <h3>📤 Upload Image or Photo</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="upload-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {!previewImage && !isProcessing && (
            <div 
              className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              <div className="upload-icon">📁</div>
              <p>Drop an image here or click to browse</p>
              <p className="upload-formats">Take a photo with your phone camera app, then upload it here</p>
              <p className="upload-formats">Supports: PNG, JPG, GIF, WebP (max 10MB)</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                style={{ display: 'none' }}
              />
            </div>
          )}
          
          {previewImage && (
            <div className="image-preview">
              <img src={previewImage} alt="Uploaded preview" />
              {!isProcessing && (
                <button 
                  className="process-again-btn"
                  onClick={() => {
                    setPreviewImage(null);
                    setError(null);
                  }}
                >
                  Upload Different Image
                </button>
              )}
            </div>
          )}
          
          {isProcessing && (
            <div className="processing-message">
              <div className="processing-spinner">🔄</div>
              <p>Processing image and extracting text...</p>
              <p className="processing-note">This may take a few seconds</p>
            </div>
          )}
          
          <div className="upload-tips">
            <h4>💡 Tips for better results:</h4>
            <ul>
              <li>Use high-contrast images (dark text on light background)</li>
              <li>Ensure text is clearly readable</li>
              <li>Avoid blurry or distorted images</li>
              <li>Handwritten notes work best when neat and clear</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageUpload;