import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { todoService } from '../services/todoService';

function AdminDashboard({ currentUser, onClose }) {
  const [users, setUsers] = useState([]);
  const [allTodos, setAllTodos] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTodos, setUserTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, todosData] = await Promise.all([
        authService.getAllUsers(),
        todoService.getAllTodos()
      ]);
      setUsers(usersData);
      setAllTodos(todosData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      alert('Error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    try {
      const todos = await todoService.getTodosByUserId(user.userId);
      setUserTodos(todos);
    } catch (error) {
      console.error('Error loading user todos:', error);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      isActive: user.isActive,
      password: ''
    });
  };

  const handleSaveUser = async () => {
    try {
      const updates = { ...editForm };
      if (!updates.password) {
        delete updates.password; // Don't update password if empty
      }
      
      await authService.updateUserAdmin(editingUser.email, updates);
      await loadData(); // Reload data
      setEditingUser(null);
      setEditForm({});
      alert('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user: ' + error.message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.email === currentUser.email) {
      alert("You can't delete your own admin account!");
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${user.name} (${user.email})?`)) {
      try {
        await authService.deleteUser(user.email);
        await loadData();
        alert('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
      }
    }
  };

  const handleDeleteTodo = async (userId, todoId) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await todoService.deleteTodoAdmin(userId, todoId);
        if (selectedUser) {
          const todos = await todoService.getTodosByUserId(selectedUser.userId);
          setUserTodos(todos);
        }
        await loadData();
        alert('Todo deleted successfully');
      } catch (error) {
        console.error('Error deleting todo:', error);
        alert('Error deleting todo: ' + error.message);
      }
    }
  };

  const handleToggleTodo = async (userId, todoId, currentCompleted) => {
    try {
      await todoService.updateTodoAdmin(userId, todoId, { completed: !currentCompleted });
      if (selectedUser) {
        const todos = await todoService.getTodosByUserId(selectedUser.userId);
        setUserTodos(todos);
      }
      await loadData();
    } catch (error) {
      console.error('Error toggling todo:', error);
      alert('Error updating todo: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h2>🔧 Admin Dashboard</h2>
          <button onClick={onClose} className="close-admin">✕</button>
        </div>
        <div className="loading">Loading admin data...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>🔧 Admin Dashboard</h2>
        <button onClick={onClose} className="close-admin">✕</button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({users.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          📝 All Todos ({allTodos.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="admin-section">
          <h3>User Management</h3>
          <div className="users-grid">
            {users.map(user => (
              <div key={user.email} className="user-card">
                <div className="user-info">
                  <h4>{user.name} {user.isAdmin && '👑'}</h4>
                  <p>{user.email}</p>
                  <p className="user-status">
                    Status: <span className={user.isActive ? 'active' : 'inactive'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  <p className="user-joined">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="user-actions">
                  <button 
                    onClick={() => handleUserClick(user)}
                    className="view-todos-btn"
                  >
                    View Todos
                  </button>
                  <button 
                    onClick={() => handleEditUser(user)}
                    className="edit-user-btn"
                  >
                    Edit
                  </button>
                  {user.email !== currentUser.email && (
                    <button 
                      onClick={() => handleDeleteUser(user)}
                      className="delete-user-btn"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedUser && (
            <div className="user-todos-section">
              <h3>{selectedUser.name}'s Todos ({userTodos.length})</h3>
              {userTodos.length === 0 ? (
                <p>No todos found for this user.</p>
              ) : (
                <div className="admin-todos-list">
                  {userTodos.map(todo => (
                    <div key={todo.todoId} className="admin-todo-item">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(selectedUser.userId, todo.todoId, todo.completed)}
                      />
                      <div className="admin-todo-content">
                        <span className={todo.completed ? 'completed' : ''}>{todo.text}</span>
                        <div className="admin-todo-meta">
                          {todo.category} | {todo.priority?.level} | {todo.timeEstimate?.display}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteTodo(selectedUser.userId, todo.todoId)}
                        className="delete-todo-btn"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'todos' && (
        <div className="admin-section">
          <h3>All Todos Overview</h3>
          <div className="todos-stats">
            <div className="stat-card">
              <h4>Total Todos</h4>
              <p>{allTodos.length}</p>
            </div>
            <div className="stat-card">
              <h4>Completed</h4>
              <p>{allTodos.filter(t => t.completed).length}</p>
            </div>
            <div className="stat-card">
              <h4>Pending</h4>
              <p>{allTodos.filter(t => !t.completed).length}</p>
            </div>
          </div>
          
          <div className="admin-todos-list">
            {allTodos.slice(0, 20).map(todo => {
              const user = users.find(u => u.userId === todo.userId);
              return (
                <div key={`${todo.userId}-${todo.todoId}`} className="admin-todo-item">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo.userId, todo.todoId, todo.completed)}
                  />
                  <div className="admin-todo-content">
                    <span className={todo.completed ? 'completed' : ''}>{todo.text}</span>
                    <div className="admin-todo-meta">
                      👤 {user?.name || 'Unknown User'} | {todo.category} | {todo.priority?.level}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteTodo(todo.userId, todo.todoId)}
                    className="delete-todo-btn"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
          {allTodos.length > 20 && (
            <p className="showing-note">Showing first 20 todos...</p>
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3>Edit User: {editingUser.name}</h3>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Status:</label>
              <select
                value={editForm.isActive}
                onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'true'})}
              >
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reset Password (optional):</label>
              <input
                type="password"
                placeholder="Enter new password or leave empty"
                value={editForm.password}
                onChange={(e) => setEditForm({...editForm, password: e.target.value})}
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleSaveUser} className="save-btn">Save Changes</button>
              <button onClick={() => setEditingUser(null)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;