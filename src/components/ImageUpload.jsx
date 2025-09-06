import React, { useState, useRef } from 'react';
import { extractTextFromImage, parseTextToTodos } from '../utils/visionUtils';

function ImageUpload({ onTodosExtracted, onClose }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState(null);
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

  const processImage = async (file, usePreprocessing = true) => {
    try {
      setIsProcessing(true);
      setError(null);
      setExtractedText('');

      // Extract text from image
      const text = await extractTextFromImage(file, usePreprocessing);
      setExtractedText(text);
      
      if (!text || text.trim().length === 0) {
        setError('No text found in the image. Try the manual input option below.');
        setShowManualInput(true);
        return;
      }

      console.log('Extracted text:', text);

      // Parse text into todo items (with AI analysis)
      const todoItems = await parseTextToTodos(text);
      
      if (todoItems.length === 0) {
        setError(`Could not identify todo items. Try manual input. Text found: "${text.substring(0, 100)}..."`);
        setShowManualInput(true);
        setManualText(text);
        return;
      }

      // Pass the extracted todos back to parent
      onTodosExtracted(todoItems);
      
    } catch (error) {
      console.error('Error processing image:', error);
      
      if (error.message.includes('low quality') || error.message.includes('LOW_CONFIDENCE')) {
        setError(error.message + ' Try the manual input option below.');
        setShowManualInput(true);
      } else {
        setError('Failed to process the image. Please try again or use manual input.');
        setShowManualInput(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim()) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const todoItems = await parseTextToTodos(manualText.trim());
      
      if (todoItems.length === 0) {
        setError('Could not identify any todo items in the text. Please check your formatting.');
        return;
      }
      
      onTodosExtracted(todoItems);
    } catch (error) {
      console.error('Error processing manual text:', error);
      setError('Failed to process the text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryWithPreprocessing = () => {
    if (previewImage) {
      // Get the original file from the preview
      fetch(previewImage)
        .then(r => r.blob())
        .then(blob => {
          processImage(new File([blob], "image.png", { type: blob.type }), false);
        });
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
              {previewImage && (
                <button onClick={handleRetryWithPreprocessing} className="retry-btn">
                  Try Different Processing
                </button>
              )}
            </div>
          )}
          
          {extractedText && (
            <div className="extracted-text-preview">
              <h4>📝 Extracted Text:</h4>
              <div className="text-preview">"{extractedText}"</div>
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
          
          {showManualInput && (
            <div className="manual-input-section">
              <h4>✍️ Manual Input (Fallback)</h4>
              <p>If OCR failed, type your todos manually:</p>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type your todos here, one per line:&#10;- Buy groceries&#10;- Call dentist&#10;- Finish report"
                className="manual-text-input"
                rows="6"
                disabled={isProcessing}
              />
              <div className="manual-actions">
                <button 
                  className="process-manual-btn"
                  onClick={handleManualSubmit}
                  disabled={isProcessing || !manualText.trim()}
                >
                  {isProcessing ? '🔄 Processing...' : '✓ Process Text'}
                </button>
                <button 
                  className="cancel-manual-btn"
                  onClick={() => {
                    setShowManualInput(false);
                    setManualText('');
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="upload-tips">
            <h4>💡 Tips for better results:</h4>
            <ul>
              <li><strong>Use high-contrast images</strong> (dark text on light background)</li>
              <li><strong>Write clearly</strong> - print letters work better than cursive</li>
              <li><strong>Good lighting</strong> - avoid shadows and glare</li>
              <li><strong>Hold steady</strong> - avoid blurry photos</li>
              <li><strong>One todo per line</strong> - use bullet points or numbers</li>
              <li>If OCR fails, use the manual input option</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageUpload;