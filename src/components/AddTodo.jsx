import React, { useState, useEffect, useRef } from 'react';
import { getSuggestions, splitMultipleTodos } from '../utils/aiHelpers';
import ImageUpload from './ImageUpload';

function AddTodo({ addTodo, todos, loading, onTypingStart, onTypingEnd }) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [extractedTodos, setExtractedTodos] = useState(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('extractedTodos');
    return saved ? JSON.parse(saved) : [];
  });
  const [autoAddExtracted, setAutoAddExtracted] = useState(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem('autoAddExtracted');
    return saved === 'true';
  });
  const typingTimeoutRef = useRef(null);

  // Save extracted todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('extractedTodos', JSON.stringify(extractedTodos));
  }, [extractedTodos]);
  
  // Save auto-add preference to localStorage
  useEffect(() => {
    localStorage.setItem('autoAddExtracted', autoAddExtracted.toString());
  }, [autoAddExtracted]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (text.length > 2) {
      const newSuggestions = getSuggestions(text, todos);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [text, todos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (text.trim()) {
      // Split multiple todos from the input
      const multipleTodos = splitMultipleTodos(text.trim());
      
      if (multipleTodos.length > 1) {
        console.log(`Detected ${multipleTodos.length} todos:`, multipleTodos);
        // Add each todo separately
        for (const todoText of multipleTodos) {
          await addTodo(todoText);
        }
      } else {
        // Single todo, add normally
        await addTodo(text);
      }
      
      setText('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setText(suggestion);
    setShowSuggestions(false);
  };

  const handleTodosExtracted = async (todoItems) => {
    setExtractedTodos(todoItems);
    setShowImageUpload(false);
    
    // Auto-add if option is enabled
    if (autoAddExtracted && todoItems.length > 0) {
      console.log(`Auto-adding ${todoItems.length} extracted todos...`);
      for (const todoItem of todoItems) {
        if (todoItem.isAnalyzed) {
          await addTodo(todoItem.text, todoItem);
        } else {
          await addTodo(todoItem);
        }
      }
      setExtractedTodos([]);
      console.log('All extracted todos have been added!');
    } else if (todoItems.length > 0) {
      console.log(`Successfully extracted ${todoItems.length} todos. Click "Add All" or add them individually.`);
    }
  };

  const handleAddExtractedTodo = async (todoItem) => {
    // If already analyzed, pass the full data, otherwise just the text
    if (todoItem.isAnalyzed) {
      await addTodo(todoItem.text, todoItem);
    } else {
      await addTodo(todoItem);
    }
    setExtractedTodos(extractedTodos.filter(todo => todo !== todoItem));
  };

  const handleAddAllExtractedTodos = async () => {
    for (const todoItem of extractedTodos) {
      if (todoItem.isAnalyzed) {
        await addTodo(todoItem.text, todoItem);
      } else {
        await addTodo(todoItem);
      }
    }
    setExtractedTodos([]);
  };

  const handleDiscardExtracted = () => {
    setExtractedTodos([]);
  };

  return (
    <div className="card add-todo-container">
      <form onSubmit={handleSubmit} className="add-todo-form">
        <div className="input-group add-todo-input-group">
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              
              // Clear any existing timeout
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              
              // Mark as typing
              if (onTypingStart) onTypingStart();
              
              // Set a timeout to mark as not typing after 1 second of no input
              typingTimeoutRef.current = setTimeout(() => {
                if (onTypingEnd) onTypingEnd();
              }, 1000);
            }}
            onFocus={() => onTypingStart && onTypingStart()}
            onBlur={() => {
              // Clear timeout and mark as not typing
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              if (onTypingEnd) onTypingEnd();
            }}
            placeholder="What needs to be done?"
            className="input input-primary"
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary btn-icon" disabled={loading}>
            {loading ? (
              <span className="loading-spinner">⏳</span>
            ) : (
              <span>➕</span>
            )}
          </button>
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
      </form>
      
      <div className="vision-section">
        <button 
          className="btn btn-secondary"
          onClick={() => setShowImageUpload(true)}
          disabled={loading}
        >
          <span className="btn-icon">📱</span>
          Upload Image
        </button>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={autoAddExtracted}
            onChange={(e) => setAutoAddExtracted(e.target.checked)}
            className="checkbox"
          />
          <span className="checkbox-text">Auto-add extracted todos</span>
        </label>
      </div>

      {extractedTodos.length > 0 && (
        <div className="card extracted-todos">
          <div className="alert alert-warning">
            <span className="alert-icon">⚠️</span>
            Review extracted todos - they won't be saved until you click "Add"
          </div>
          <div className="extracted-header">
            <h3 className="extracted-title">📝 Extracted Todos ({extractedTodos.length})</h3>
            <div className="btn-group">
              <button 
                className="btn btn-primary btn-small"
                onClick={handleAddAllExtractedTodos}
                disabled={loading}
              >
                ➕ Add All
              </button>
              <button 
                className="btn btn-text btn-small"
                onClick={handleDiscardExtracted}
              >
                🗑️ Discard
              </button>
            </div>
          </div>
          <div className="extracted-list">
            {extractedTodos.map((todo, index) => (
              <div key={index} className="extracted-item">
                <div className="extracted-item-content">
                  <span className="extracted-text">{todo.text || todo}</span>
                  {todo.isAnalyzed && (
                    <div className="extracted-meta">
                      <span className="badge badge-category">
                        {todo.category}
                      </span>
                      <span className="badge badge-priority" style={{
                        backgroundColor: todo.priority.color
                      }}>
                        {todo.priority.level}
                      </span>
                      <span className="extracted-sentiment" title={todo.sentiment.mood}>
                        {todo.sentiment.emoji}
                      </span>
                      <span className="badge badge-time">
                        ⏱ {todo.timeEstimate.display}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-icon btn-small"
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
        <div className="hint-content">
          <span className="hint-icon">💡</span>
          <div className="hint-text">
            Try: "urgent meeting tomorrow" • "buy groceries" • "study for exam"
            <br />
            <span className="hint-subtext">📱 Or upload a photo to extract todos automatically</span>
          </div>
        </div>
      </div>

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