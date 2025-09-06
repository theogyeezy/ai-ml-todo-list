// Simple user management - generates a unique ID per browser
export const getUserId = () => {
  let userId = localStorage.getItem('todoapp-user-id');
  
  if (!userId) {
    // Generate a unique user ID for this browser
    userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('todoapp-user-id', userId);
  }
  
  return userId;
};

export const clearUserId = () => {
  localStorage.removeItem('todoapp-user-id');
};