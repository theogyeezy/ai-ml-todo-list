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
      <div className="auth-form">
        <h2 className="auth-title">
          {isLogin ? '👋 Welcome Back!' : '✨ Create Account'}
        </h2>
        <p className="auth-subtitle">
          {isLogin 
            ? 'Sign in to access your personal AI todo list' 
            : 'Join to get your own smart todo assistant'
          }
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                className="auth-input"
              />
            </div>
          )}

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="auth-input"
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            className="switch-button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ email: '', password: '', name: '' });
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

        <div className="auth-info">
          <p>🔒 Your data is securely stored in AWS</p>
          <p>🤖 AI analysis happens in your browser</p>
        </div>
      </div>
    </div>
  );
}

export default AuthForm;