import React, { useState, useRef, useEffect } from 'react';
import { 
  captureImageFromCamera, 
  stopCameraStream, 
  capturePhotoFromStream,
  extractTextFromImage,
  parseTextToTodos 
} from '../utils/visionUtils';

function CameraCapture({ onTodosExtracted, onClose }) {
  const [stream, setStream] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stopCameraStream(stream);
      }
    };
  }, [stream]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);
      const cameraStream = await captureImageFromCamera();
      setStream(cameraStream);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied. Please enable camera permissions and try again.');
    }
  };

  const capturePhoto = async () => {
    if (!stream || !videoRef.current) {
      setError('Camera not ready. Please try again.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Capture photo from video stream
      const photoBlob = await capturePhotoFromStream(videoRef.current);
      
      // Extract text from the photo
      const extractedText = await extractTextFromImage(photoBlob);
      
      if (!extractedText || extractedText.trim().length === 0) {
        setError('No text found in the image. Please try again with better lighting or focus.');
        return;
      }

      // Parse text into todo items
      const todoItems = parseTextToTodos(extractedText);
      
      if (todoItems.length === 0) {
        setError('Could not identify any todo items in the text. Please try again.');
        return;
      }

      // Pass the extracted todos back to parent
      onTodosExtracted(todoItems);
      
    } catch (error) {
      console.error('Error processing photo:', error);
      setError('Failed to process the photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (stream) {
      stopCameraStream(stream);
    }
    onClose();
  };

  return (
    <div className="camera-capture-overlay">
      <div className="camera-capture-modal">
        <div className="camera-header">
          <h3>📸 Capture Todos</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        <div className="camera-content">
          {error && (
            <div className="error-message">
              {error}
              {error.includes('Camera access denied') && (
                <button onClick={startCamera} className="retry-btn">
                  Try Again
                </button>
              )}
            </div>
          )}
          
          {stream && (
            <div className="camera-preview">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <div className="camera-overlay">
                <div className="capture-zone">
                  <div className="capture-corners"></div>
                  <p>Position your handwritten notes or todo list within this frame</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="camera-controls">
            <button 
              className="capture-btn"
              onClick={capturePhoto}
              disabled={!stream || isProcessing}
            >
              {isProcessing ? '🔄 Processing...' : '📸 Capture & Extract Todos'}
            </button>
          </div>
          
          <div className="camera-tips">
            <h4>💡 Tips for better results:</h4>
            <ul>
              <li>Ensure good lighting</li>
              <li>Keep text horizontal and clear</li>
              <li>Use dark text on light background</li>
              <li>Avoid shadows and glare</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraCapture;