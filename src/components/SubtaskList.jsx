import { useState, useEffect } from 'react';
import { todoService } from '../services/todoService';
import { categorizeTask, predictPriority, analyzeSentiment, estimateTime } from '../utils/aiHelpers';

function SubtaskList({ parentTodoId, onSubtasksChange }) {
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (parentTodoId) {
      loadSubtasks();
    }
  }, [parentTodoId]);

  const loadSubtasks = async () => {
    try {
      const subtasksData = await todoService.getSubtasks(parentTodoId);
      setSubtasks(subtasksData);
      if (onSubtasksChange) {
        onSubtasksChange(subtasksData);
      }
    } catch (error) {
      console.error('Error loading subtasks:', error);
    }
  };

  const addSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim() || loading) return;

    setLoading(true);
    try {
      // AI analysis for subtask
      const priority = await predictPriority(newSubtaskText);
      const sentiment = await analyzeSentiment(newSubtaskText);
      const timeEstimate = await estimateTime(newSubtaskText);
      const category = await categorizeTask(newSubtaskText);

      const subtaskData = {
        text: newSubtaskText.trim(),
        category,
        priority,
        sentiment,
        timeEstimate
      };

      const newSubtask = await todoService.createSubtask(parentTodoId, subtaskData);
      setSubtasks([...subtasks, newSubtask]);
      setNewSubtaskText('');
      setShowAddForm(false);
      
      if (onSubtasksChange) {
        onSubtasksChange([...subtasks, newSubtask]);
      }
    } catch (error) {
      console.error('Error creating subtask:', error);
      alert('Error creating subtask. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubtask = async (subtaskId) => {
    try {
      const subtask = subtasks.find(s => s.todoId === subtaskId);
      if (!subtask) return;

      const updatedSubtask = await todoService.updateTodo(subtaskId, {
        completed: !subtask.completed
      });

      setSubtasks(subtasks.map(s => 
        s.todoId === subtaskId ? updatedSubtask : s
      ));

      if (onSubtasksChange) {
        onSubtasksChange(subtasks.map(s => 
          s.todoId === subtaskId ? updatedSubtask : s
        ));
      }
    } catch (error) {
      console.error('Error toggling subtask:', error);
      alert('Error updating subtask. Please try again.');
    }
  };

  const deleteSubtask = async (subtaskId) => {
    if (!confirm('Are you sure you want to delete this subtask?')) return;

    try {
      await todoService.deleteSubtask(subtaskId, parentTodoId);
      const updatedSubtasks = subtasks.filter(s => s.todoId !== subtaskId);
      setSubtasks(updatedSubtasks);
      
      if (onSubtasksChange) {
        onSubtasksChange(updatedSubtasks);
      }
    } catch (error) {
      console.error('Error deleting subtask:', error);
      alert('Error deleting subtask. Please try again.');
    }
  };

  const getCompletionPercentage = () => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(s => s.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  return (
    <div className="subtasks-container">
      {subtasks.length > 0 && (
        <div className="subtasks-progress">
          <div className="progress-info">
            <span className="subtasks-count">
              {subtasks.filter(s => s.completed).length}/{subtasks.length} subtasks completed
            </span>
            <span className="completion-percentage">{getCompletionPercentage()}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getCompletionPercentage()}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="subtasks-list">
        {subtasks.map(subtask => (
          <div key={subtask.todoId} className={`subtask-item ${subtask.completed ? 'completed' : ''}`}>
            <div className="subtask-main">
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => toggleSubtask(subtask.todoId)}
                className="subtask-checkbox"
              />
              <span className="subtask-text">{subtask.text}</span>
              <div className="subtask-meta">
                <span className="subtask-category" style={{ color: subtask.priority?.color }}>
                  {subtask.category}
                </span>
                <span className="subtask-time">{subtask.timeEstimate?.display}</span>
                <span className="subtask-sentiment">{subtask.sentiment?.emoji}</span>
              </div>
            </div>
            <button 
              onClick={() => deleteSubtask(subtask.todoId)}
              className="delete-subtask-btn"
              title="Delete subtask"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="add-subtask-section">
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)}
            className="add-subtask-btn"
            disabled={loading}
          >
            ➕ Add Subtask
          </button>
        ) : (
          <form onSubmit={addSubtask} className="add-subtask-form">
            <input
              type="text"
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              placeholder="Enter subtask..."
              className="subtask-input"
              autoFocus
              disabled={loading}
            />
            <div className="subtask-form-buttons">
              <button type="submit" disabled={loading || !newSubtaskText.trim()}>
                {loading ? 'Adding...' : 'Add'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowAddForm(false);
                  setNewSubtaskText('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SubtaskList;