import React from 'react';
import TodoItem from './TodoItem';

function TodoList({ todos, toggleTodo, deleteTodo }) {
  return (
    <div className="todo-list">
      {todos.length === 0 ? (
        <p className="empty-message">No todos yet. Add one above!</p>
      ) : (
        todos.map(todo => (
          <TodoItem
            key={todo.todoId || todo.id}
            todo={todo}
            toggleTodo={toggleTodo}
            deleteTodo={deleteTodo}
          />
        ))
      )}
    </div>
  );
}

export default TodoList;