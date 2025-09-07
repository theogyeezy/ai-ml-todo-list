import React from 'react';
import TodoItem from './TodoItem';

function TodoList({ todos, toggleTodo, deleteTodo, updateTodo }) {
  // Filter out subtasks - they should only appear within their parent todos
  const parentTodos = todos.filter(todo => !todo.parentTodoId);

  return (
    <div className="todo-list">
      {parentTodos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">—</div>
          <h3 className="empty-title">No todos yet</h3>
          <p className="empty-message">Add your first todo above to get started!</p>
        </div>
      ) : (
        parentTodos.map(todo => (
          <TodoItem
            key={todo.todoId || todo.id}
            todo={todo}
            toggleTodo={toggleTodo}
            deleteTodo={deleteTodo}
            updateTodo={updateTodo}
          />
        ))
      )}
    </div>
  );
}

export default TodoList;