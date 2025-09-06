import React, { useState, useEffect, useRef } from 'react';
import { getSuggestions } from '../utils/aiHelpers';
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
    <div className="add-todo-container">
      <form onSubmit={handleSubmit} className="add-todo-form">
        <div className="input-wrapper">
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
          className="vision-btn upload-btn"
          onClick={() => setShowImageUpload(true)}
          disabled={loading}
        >
          📤 Upload Image or Photo
        </button>
      </div>
      
      <div className="vision-options">
        <label className="auto-add-checkbox">
          <input
            type="checkbox"
            checked={autoAddExtracted}
            onChange={(e) => setAutoAddExtracted(e.target.checked)}
          />
          <span>Auto-add extracted todos immediately</span>
        </label>
      </div>

      {extractedTodos.length > 0 && (
        <div className="extracted-todos highlighted">
          <div className="extracted-warning">
            ⚠️ Review extracted todos below - they won't be saved until you click "Add"!
          </div>
          <div className="extracted-header">
            <h3>📝 Extracted Todos ({extractedTodos.length})</h3>
            <div className="extracted-actions">
              <button 
                className="add-all-btn pulse"
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
                <div className="extracted-item-content">
                  <span className="extracted-text">{todo.text || todo}</span>
                  {todo.isAnalyzed && (
                    <div className="extracted-meta">
                      <span className="category-badge" style={{fontSize: '0.7rem'}}>
                        {todo.category}
                      </span>
                      <span className="priority-badge" style={{
                        backgroundColor: todo.priority.color,
                        fontSize: '0.7rem'
                      }}>
                        {todo.priority.level}
                      </span>
                      <span className="sentiment-emoji" title={todo.sentiment.mood}>
                        {todo.sentiment.emoji}
                      </span>
                      <span className="time-estimate" style={{fontSize: '0.7rem'}}>
                        ⏱ {todo.timeEstimate.display}
                      </span>
                    </div>
                  )}
                </div>
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
        📸 Or upload a photo of your handwritten notes to extract todos automatically!
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