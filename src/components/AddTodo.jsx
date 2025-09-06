import React, { useState, useEffect } from 'react';
import { getSuggestions } from '../utils/aiHelpers';
import CameraCapture from './CameraCapture';
import ImageUpload from './ImageUpload';

function AddTodo({ addTodo, todos, loading }) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [extractedTodos, setExtractedTodos] = useState([]);

  useEffect(() => {
    if (text.length > 2) {
      const newSuggestions = getSuggestions(text, todos);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [text, todos]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      addTodo(text);
      setText('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setText(suggestion);
    setShowSuggestions(false);
  };

  const handleTodosExtracted = (todoItems) => {
    setExtractedTodos(todoItems);
    setShowCameraCapture(false);
    setShowImageUpload(false);
  };

  const handleAddExtractedTodo = async (todoText) => {
    await addTodo(todoText);
    setExtractedTodos(extractedTodos.filter(todo => todo !== todoText));
  };

  const handleAddAllExtractedTodos = async () => {
    for (const todoText of extractedTodos) {
      await addTodo(todoText);
    }
    setExtractedTodos([]);
  };

  const handleDiscardExtracted = () => {
    setExtractedTodos([]);
  };

  return (
    <div className="add-todo-container">
      <form onSubmit={handleSubmit} className="add-todo-form">
        <div className="input-wrapper">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter a new todo... (AI will analyze it!)"
            className="todo-input"
            disabled={loading}
          />
          {showSuggestions && (
            <div className="suggestions-dropdown">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="add-btn" disabled={loading}>
          {loading ? 'Analyzing...' : 'Add Todo'}
        </button>
      </form>
      
      <div className="vision-controls">
        <button 
          className="vision-btn camera-btn"
          onClick={() => setShowCameraCapture(true)}
          disabled={loading}
        >
          📸 Take Photo
        </button>
        <button 
          className="vision-btn upload-btn"
          onClick={() => setShowImageUpload(true)}
          disabled={loading}
        >
          📤 Upload Image
        </button>
      </div>

      {extractedTodos.length > 0 && (
        <div className="extracted-todos">
          <div className="extracted-header">
            <h3>📝 Extracted Todos ({extractedTodos.length})</h3>
            <div className="extracted-actions">
              <button 
                className="add-all-btn"
                onClick={handleAddAllExtractedTodos}
                disabled={loading}
              >
                ➕ Add All
              </button>
              <button 
                className="discard-btn"
                onClick={handleDiscardExtracted}
              >
                🗑️ Discard
              </button>
            </div>
          </div>
          <div className="extracted-list">
            {extractedTodos.map((todo, index) => (
              <div key={index} className="extracted-item">
                <span className="extracted-text">{todo}</span>
                <button
                  className="add-single-btn"
                  onClick={() => handleAddExtractedTodo(todo)}
                  disabled={loading}
                >
                  ➕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="ai-hint">
        💡 Try: "urgent meeting tomorrow", "buy groceries", "study for exam", "call mom"
        <br />
        📸 Or take a photo of your handwritten notes to extract todos automatically!
      </div>

      {showCameraCapture && (
        <CameraCapture
          onTodosExtracted={handleTodosExtracted}
          onClose={() => setShowCameraCapture(false)}
        />
      )}

      {showImageUpload && (
        <ImageUpload
          onTodosExtracted={handleTodosExtracted}
          onClose={() => setShowImageUpload(false)}
        />
      )}
    </div>
  );
}

export default AddTodo;