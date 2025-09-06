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
        👤 {user.name} {user.isAdmin && '👑'} | 💾 Cloud Storage Active | 📊 Click for options
      </div>
    );
  }

  return (
    <div className="user-profile-expanded">
      <div className="profile-header">
        <h3>👤 Account Info</h3>
        <button 
          className="close-profile"
          onClick={() => setShowProfile(false)}
        >
          ✕
        </button>
      </div>
      
      <div className="profile-details">
        <div className="profile-item">
          <strong>Name:</strong> {user.name} {user.isAdmin && '👑 Admin'}
        </div>
        <div className="profile-item">
          <strong>Email:</strong> {user.email}
        </div>
        <div className="profile-item">
          <strong>User ID:</strong> {user.userId.slice(-8)}...
        </div>
        <div className="profile-item">
          <strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="profile-actions">
        <button 
          className="admin-btn" 
          onClick={handleRefreshProfile}
          disabled={refreshing}
          style={{ background: '#4CAF50', marginBottom: '0.5rem' }}
        >
          {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Profile'}
        </button>
        {user.isAdmin && (
          <button className="admin-btn" onClick={onShowAdmin}>
            🔧 Admin Dashboard
          </button>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}

export default UserProfile;