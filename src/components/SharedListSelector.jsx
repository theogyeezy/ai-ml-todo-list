import { useState, useEffect } from 'react';
import { todoService } from '../services/todoService';
import { authService } from '../services/authService';

function SharedListSelector({ onListChange, currentListId }) {
  const [sharedLists, setSharedLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState('editor');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    loadSharedLists();
  }, []);

  const loadSharedLists = async () => {
    try {
      setLoading(true);
      const lists = await todoService.getSharedLists();
      setSharedLists(lists);
    } catch (error) {
      console.error('Error loading shared lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSharedList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      setLoading(true);
      const listData = {
        name: newListName.trim(),
        description: newListDescription.trim()
      };
      
      const newList = await todoService.createSharedList(listData);
      setSharedLists([...sharedLists, newList]);
      setNewListName('');
      setNewListDescription('');
      setShowCreateForm(false);
      
      // Auto-select the new list
      onListChange(newList.listId);
    } catch (error) {
      console.error('Error creating shared list:', error);
      alert('Error creating shared list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleListChange = (listId) => {
    onListChange(listId);
  };

  const inviteUserToList = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentListId) return;

    try {
      setInviteLoading(true);
      
      // First, find the user by email
      const user = await authService.getUserByEmail(inviteEmail.trim());
      if (!user) {
        alert('User not found. Please check the email address.');
        return;
      }

      // Add the user to the shared list
      await todoService.addMemberToSharedList(currentListId, user.userId, invitePermission);
      
      // Reload shared lists to get updated data
      await loadSharedLists();
      
      // Reset form
      setInviteEmail('');
      setInvitePermission('editor');
      setShowInviteModal(false);
      
      alert(`Successfully invited ${user.name} to the list!`);
    } catch (error) {
      console.error('Error inviting user:', error);
      alert(error.message || 'Error inviting user. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const getCurrentList = () => {
    return sharedLists.find(list => list.listId === currentListId);
  };

  const canInviteUsers = () => {
    const currentList = getCurrentList();
    if (!currentList) return false;
    
    // Check if user is owner of the current list
    const currentUser = JSON.parse(localStorage.getItem('todo-user'));
    return currentList.ownerId === currentUser?.userId;
  };

  return (
    <div className="card shared-list-selector">
      <div className="list-selector-header">
        <label htmlFor="listSelect" className="form-label">Select List:</label>
        <select 
          id="listSelect"
          value={currentListId || ''}
          onChange={(e) => handleListChange(e.target.value || null)}
          disabled={loading}
          className="select select-primary"
        >
          <option value="">My Personal List</option>
          {sharedLists.map(list => (
            <option key={list.listId} value={list.listId}>
              {list.name} {(() => {
                const currentUser = JSON.parse(localStorage.getItem('todo-user'));
                return list.ownerId === currentUser?.userId ? ' (Owner)' : '';
              })()}
            </option>
          ))}
        </select>
      </div>

      <div className="list-actions">
        {!showCreateForm ? (
          <div className="btn-group">
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btn-secondary btn-small"
              disabled={loading}
            >
              ➕ Create List
            </button>
            {currentListId && canInviteUsers() && (
              <button 
                onClick={() => setShowInviteModal(true)}
                className="btn btn-primary btn-small"
                disabled={loading}
              >
                👥 Invite Users
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={createSharedList} className="create-list-form">
            <div className="input-group">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                className="input input-primary"
                required
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="Description (optional)..."
                className="input input-primary"
                disabled={loading}
              />
            </div>
            <div className="btn-group">
              <button 
                type="submit" 
                className="btn btn-primary btn-small"
                disabled={loading || !newListName.trim()}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button 
                type="button"
                className="btn btn-text btn-small"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewListName('');
                  setNewListDescription('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {currentListId && (
        <div className="current-list-info">
          {(() => {
            const currentList = getCurrentList();
            if (!currentList) return null;
            
            return (
              <div className="card list-info-card">
                <div className="list-info-header">
                  <h4 className="list-title">👥 {currentList.name}</h4>
                  {canInviteUsers() && (
                    <button 
                      onClick={() => setShowInviteModal(true)}
                      className="btn btn-icon btn-small"
                      title="Invite users"
                    >
                      ➕
                    </button>
                  )}
                </div>
                {currentList.description && (
                  <p className="list-description">{currentList.description}</p>
                )}
                <div className="list-meta">
                  <span className="badge badge-info">
                    👤 {currentList.members?.length || 1} member{(currentList.members?.length || 1) !== 1 ? 's' : ''}
                  </span>
                  <span className="badge badge-secondary">
                    Your role: {(() => {
                      const currentUser = JSON.parse(localStorage.getItem('todo-user'));
                      return currentList.permissions?.[currentUser?.userId] || 'member';
                    })()}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal card">
            <div className="modal-header">
              <h3>👥 Invite User to List</h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="btn btn-icon btn-small modal-close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={inviteUserToList} className="modal-content">
              <div className="input-group">
                <label className="form-label">Email Address:</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter user's email..."
                  className="input input-primary"
                  required
                  disabled={inviteLoading}
                />
              </div>
              <div className="input-group">
                <label className="form-label">Permission Level:</label>
                <select
                  value={invitePermission}
                  onChange={(e) => setInvitePermission(e.target.value)}
                  className="select select-primary"
                  disabled={inviteLoading}
                >
                  <option value="viewer">👀 Viewer (read-only)</option>
                  <option value="editor">✏️ Editor (can add/edit todos)</option>
                </select>
              </div>
              <div className="modal-actions btn-group">
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={inviteLoading || !inviteEmail.trim()}
                >
                  {inviteLoading ? 'Inviting...' : '📤 Send Invite'}
                </button>
                <button 
                  type="button"
                  className="btn btn-text"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInvitePermission('editor');
                  }}
                  disabled={inviteLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SharedListSelector;