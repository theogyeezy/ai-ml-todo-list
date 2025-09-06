import { useState, useEffect } from 'react';
import { todoService } from '../services/todoService';

function SharedListSelector({ onListChange, currentListId }) {
  const [sharedLists, setSharedLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

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

  return (
    <div className="shared-list-selector">
      <div className="list-selector-header">
        <label htmlFor="listSelect">📋 Select List:</label>
        <select 
          id="listSelect"
          value={currentListId || ''}
          onChange={(e) => handleListChange(e.target.value || null)}
          disabled={loading}
          className="list-select"
        >
          <option value="">🏠 My Personal List</option>
          {sharedLists.map(list => (
            <option key={list.listId} value={list.listId}>
              👥 {list.name} {list.ownerId === list.permissions?.[list.ownerId] ? '(Owner)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="list-actions">
        {!showCreateForm ? (
          <button 
            onClick={() => setShowCreateForm(true)}
            className="create-list-btn"
            disabled={loading}
          >
            ➕ Create Shared List
          </button>
        ) : (
          <form onSubmit={createSharedList} className="create-list-form">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name..."
              className="list-name-input"
              required
              disabled={loading}
            />
            <input
              type="text"
              value={newListDescription}
              onChange={(e) => setNewListDescription(e.target.value)}
              placeholder="Description (optional)..."
              className="list-description-input"
              disabled={loading}
            />
            <div className="create-list-buttons">
              <button type="submit" disabled={loading || !newListName.trim()}>
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button 
                type="button" 
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
            const currentList = sharedLists.find(list => list.listId === currentListId);
            if (!currentList) return null;
            
            return (
              <div className="list-info-card">
                <h4>👥 {currentList.name}</h4>
                {currentList.description && (
                  <p className="list-description">{currentList.description}</p>
                )}
                <div className="list-meta">
                  <span className="member-count">
                    👤 {currentList.members?.length || 1} member{(currentList.members?.length || 1) !== 1 ? 's' : ''}
                  </span>
                  <span className="your-role">
                    Your role: {currentList.permissions?.[currentList.ownerId] || 'member'}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default SharedListSelector;