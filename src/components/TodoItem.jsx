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
    <div className={`card todo-item ${todo.completed ? 'completed' : ''} ${isUpdating ? 'updating' : ''}`}>
      <div className="todo-main">
        <div className="todo-checkbox-wrapper">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.todoId || todo.id)}
            className="checkbox todo-checkbox"
            disabled={isEditing || isUpdating}
          />
        </div>
        
        <div className="todo-content">
          <div className="todo-header">
            {isEditing ? (
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input input-primary todo-edit-input"
                autoFocus
                disabled={isUpdating}
              />
            ) : (
              <div className="todo-text-container">
                <span 
                  className={`todo-text ${todo.completed ? 'completed' : ''}`}
                  onDoubleClick={!todo.completed ? handleEdit : undefined}
                  title={!todo.completed ? "Double-click to edit" : ""}
                >
                  {todo.text}
                </span>
                <span className="todo-sentiment" title={`Mood: ${todo.sentiment?.mood}`}>
                  {todo.sentiment?.emoji}
                </span>
              </div>
            )}
          </div>
          
          {!isEditing && (
            <div className="todo-metadata">
              <div className="todo-badges">
                <span className="badge badge-category" style={{ 
                  backgroundColor: getCategoryColor(todo.category),
                  borderLeft: `4px solid ${todo.priority?.color || '#2196F3'}`
                }}>
                  {todo.category}
                </span>
                <span className="badge badge-priority" style={{ backgroundColor: todo.priority?.color }}>
                  {todo.priority?.level}
                </span>
                <span className="badge badge-info">
                  {todo.timeEstimate?.display}
                </span>
              </div>
              {!todo.parentTodoId && (
                <button 
                  className="btn btn-secondary btn-small subtasks-toggle"
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  title={showSubtasks ? 'Hide subtasks' : 'Show subtasks'}
                >
                  {subtasksCount > 0 ? `${subtasksCount} Subtasks` : 'Subtasks'} {showSubtasks ? '▲' : '▼'}
                </button>
              )}
            </div>
          )}
          
          {isEditing && (
            <div className="edit-actions btn-group">
              <button 
                className="btn btn-primary btn-small" 
                onClick={handleSave}
                disabled={isUpdating || !editText.trim()}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="btn btn-text btn-small" 
                onClick={handleCancel}
                disabled={isUpdating}
              >
                Cancel
              </button>
            </div>
          )}
          
          {isUpdating && (
            <div className="alert alert-info">
              <span className="alert-icon">🤖</span>
              Re-analyzing with AI...
            </div>
          )}
        </div>
        
        <div className="todo-actions">
          {!isEditing && !todo.completed && (
            <button
              onClick={handleEdit}
              className="btn btn-icon btn-small"
              title="Edit todo"
              disabled={isUpdating}
            >
              Edit
            </button>
          )}
          <button
            onClick={() => deleteTodo(todo.todoId || todo.id)}
            className="btn btn-text btn-small delete-btn"
            disabled={isEditing || isUpdating}
            title="Delete todo"
          >
            Delete
          </button>
        </div>
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