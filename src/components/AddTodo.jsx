import React, { useState, useEffect } from 'react';
import { getSuggestions } from '../utils/aiHelpers';

function AddTodo({ addTodo, todos, loading }) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
      <div className="ai-hint">
        💡 Try: "urgent meeting tomorrow", "buy groceries", "study for exam", "call mom"
      </div>
    </div>
  );
}

export default AddTodo;