import React, { useState } from 'react';
import { authService, sessionService } from '../services/authService';

function AuthForm({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let user;
      if (isLogin) {
        user = await authService.signIn(formData.email, formData.password);
      } else {
        if (!formData.name.trim()) {
          throw new Error('Name is required');
        }
        user = await authService.signUp(formData.email, formData.password, formData.name);
      }

      sessionService.setUser(user);
      onAuthSuccess(user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-form">
        <div className="auth-header">
          <h2 className="auth-title">
            {isLogin ? '👋 Welcome Back!' : '✨ Create Account'}
          </h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Sign in to access your personal AI todo list' 
              : 'Join to get your own smart todo assistant'
            }
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-content">
          {!isLogin && (
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                className="input input-primary"
              />
            </div>
          )}

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
              className="input input-primary"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="input input-primary"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-switch">
          <span className="auth-switch-text">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button 
            type="button"
            className="btn btn-text"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ email: '', password: '', name: '' });
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

        <div className="auth-footer">
          <div className="auth-info-item">
            <span className="auth-info-icon">🔒</span>
            Your data is securely stored in AWS
          </div>
          <div className="auth-info-item">
            <span className="auth-info-icon">🤖</span>
            AI analysis powered by Claude
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthForm;