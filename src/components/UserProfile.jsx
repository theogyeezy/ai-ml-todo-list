import React, { useState } from 'react';
import { sessionService } from '../services/authService';

function UserProfile({ user, onLogout, onShowAdmin }) {
  const [showProfile, setShowProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    sessionService.clearUser();
    onLogout();
  };

  const handleRefreshProfile = async () => {
    setRefreshing(true);
    try {
      const { authService } = await import('../services/authService');
      const updatedUser = await authService.getUserByEmail(user.email);
      if (updatedUser) {
        sessionService.setUser(updatedUser);
        // Force a page refresh to update the user state throughout the app
        window.location.reload();
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      alert('Error refreshing profile data');
    } finally {
      setRefreshing(false);
    }
  };

  if (!showProfile) {
    return (
      <div className="user-info" onClick={() => setShowProfile(true)}>
        <div className="user-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <h3>{user.name}</h3>
          <p>{user.isAdmin ? 'Admin' : 'User'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card user-profile-expanded">
      <div className="profile-header">
        <h3 className="profile-title">Account Info</h3>
        <button 
          className="btn btn-icon btn-small close-profile"
          onClick={() => setShowProfile(false)}
        >
          ×
        </button>
      </div>
      
      <div className="profile-details">
        <div className="profile-item">
          <span className="profile-label">Name:</span> 
          <span className="profile-value">
            {user.name} {user.isAdmin && <span className="badge badge-warning">Admin</span>}
          </span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Email:</span> 
          <span className="profile-value">{user.email}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">User ID:</span> 
          <span className="profile-value profile-id">{user.userId.slice(-8)}...</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Joined:</span> 
          <span className="profile-value">{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="profile-actions">
        <button 
          className="btn btn-secondary btn-small" 
          onClick={handleRefreshProfile}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Profile'}
        </button>
        {user.isAdmin && (
          <button 
            className="btn btn-primary btn-small" 
            onClick={onShowAdmin}
          >
            Admin Dashboard
          </button>
        )}
        <button 
          className="btn btn-text btn-small logout-btn" 
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default UserProfile;