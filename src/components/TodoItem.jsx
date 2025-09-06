import React, { useState } from 'react';
import SubtaskList from './SubtaskList';

function TodoItem({ todo, toggleTodo, deleteTodo, updateTodo }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [subtasksCount, setSubtasksCount] = useState(0);

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(todo.text);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText(todo.text);
  };

  const handleSave = async () => {
    if (editText.trim() && editText !== todo.text) {
      setIsUpdating(true);
      try {
        await updateTodo(todo.todoId || todo.id, editText.trim());
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating todo:', error);
        alert('Failed to update todo. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    } else if (editText.trim() === todo.text) {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSubtasksChange = (subtasks) => {
    setSubtasksCount(subtasks.length);
  };

  return (
    <div className={`todo-item ${isUpdating ? 'updating' : ''}`} style={{ borderLeft: `4px solid ${todo.priority?.color || '#2196F3'}` }}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.todoId || todo.id)}
        className="todo-checkbox"
        disabled={isEditing || isUpdating}
      />
      <div className="todo-content">
        <div className="todo-header">
          {isEditing ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="todo-edit-input"
              autoFocus
              disabled={isUpdating}
            />
          ) : (
            <span 
              className={`todo-text ${todo.completed ? 'completed' : ''}`}
              onDoubleClick={!todo.completed ? handleEdit : undefined}
              title={!todo.completed ? "Double-click to edit" : ""}
            >
              {todo.text}
            </span>
          )}
          {!isEditing && (
            <span className="sentiment-emoji" title={`Mood: ${todo.sentiment?.mood}`}>
              {todo.sentiment?.emoji}
            </span>
          )}
        </div>
        {!isEditing && (
          <div className="todo-metadata">
            <span className="category-badge" style={{ backgroundColor: getCategoryColor(todo.category) }}>
              {todo.category}
            </span>
            <span className="priority-badge" style={{ backgroundColor: todo.priority?.color }}>
              {todo.priority?.level}
            </span>
            <span className="time-estimate">
              ⏱️ {todo.timeEstimate?.display}
            </span>
            {!todo.parentTodoId && (
              <button 
                className="subtasks-toggle"
                onClick={() => setShowSubtasks(!showSubtasks)}
                title={showSubtasks ? 'Hide subtasks' : 'Show subtasks'}
              >
                📋 {subtasksCount > 0 ? `${subtasksCount}` : 'Subtasks'} {showSubtasks ? '▲' : '▼'}
              </button>
            )}
          </div>
        )}
        {isEditing && (
          <div className="edit-actions">
            <button 
              className="save-edit-btn" 
              onClick={handleSave}
              disabled={isUpdating || !editText.trim()}
            >
              {isUpdating ? '🔄' : '✓'} Save
            </button>
            <button 
              className="cancel-edit-btn" 
              onClick={handleCancel}
              disabled={isUpdating}
            >
              ✕ Cancel
            </button>
          </div>
        )}
        {isUpdating && (
          <div className="updating-message">
            🤖 Re-analyzing with AI...
          </div>
        )}
      </div>
      <div className="todo-actions">
        {!isEditing && !todo.completed && (
          <button
            onClick={handleEdit}
            className="edit-btn"
            title="Edit todo"
            disabled={isUpdating}
          >
            ✏️
          </button>
        )}
        <button
          onClick={() => deleteTodo(todo.todoId || todo.id)}
          className="delete-btn"
          disabled={isEditing || isUpdating}
        >
          Delete
        </button>
      </div>
      {!todo.parentTodoId && showSubtasks && (
        <div className="subtasks-section">
          <SubtaskList 
            parentTodoId={todo.todoId || todo.id}
            onSubtasksChange={handleSubtasksChange}
          />
        </div>
      )}
    </div>
  );
}

function getCategoryColor(category) {
  const colors = {
    Work: '#9C27B0',
    Personal: '#2196F3',
    Shopping: '#4CAF50',
    Health: '#FF5722',
    Education: '#00BCD4',
    Finance: '#FFC107',
    Home: '#795548'
  };
  return colors[category] || '#607D8B';
}

export default TodoItem;