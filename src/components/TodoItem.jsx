import React from 'react';

function TodoItem({ todo, toggleTodo, deleteTodo }) {
  return (
    <div className="todo-item" style={{ borderLeft: `4px solid ${todo.priority?.color || '#2196F3'}` }}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.todoId || todo.id)}
        className="todo-checkbox"
      />
      <div className="todo-content">
        <div className="todo-header">
          <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
            {todo.text}
          </span>
          <span className="sentiment-emoji" title={`Mood: ${todo.sentiment?.mood}`}>
            {todo.sentiment?.emoji}
          </span>
        </div>
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
        </div>
      </div>
      <button
        onClick={() => deleteTodo(todo.todoId || todo.id)}
        className="delete-btn"
      >
        Delete
      </button>
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