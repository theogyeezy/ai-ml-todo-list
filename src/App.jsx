import { useState, useEffect } from 'react';
import AddTodo from './components/AddTodo';
import TodoList from './components/TodoList';
import AIInsights from './components/AIInsights';
import AuthForm from './components/AuthForm';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import SharedListSelector from './components/SharedListSelector';
import { 
  categorizeTask, 
  predictPriority, 
  analyzeSentiment, 
  estimateTime 
} from './utils/aiHelpers';
import { todoService } from './services/todoService';
import { sessionService } from './services/authService';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  // TensorFlow model loading removed - using Claude for all AI
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [currentSharedListId, setCurrentSharedListId] = useState(null);

  // Check for existing user session and refresh user data
  useEffect(() => {
    const existingUser = sessionService.getUser();
    if (existingUser) {
      setUser(existingUser);
      // Refresh user data from database to get latest changes
      refreshUserData(existingUser.email);
    }
  }, []);

  // Function to refresh user data from database
  const refreshUserData = async (email) => {
    try {
      const { authService } = await import('./services/authService');
      const updatedUser = await authService.getUserByEmail(email);
      if (updatedUser) {
        sessionService.setUser(updatedUser);
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // If user no longer exists or there's an error, keep current session
    }
  };

  // TensorFlow model loading removed - Claude AI handles all analysis

  // Load todos when user or shared list changes
  useEffect(() => {
    if (user) {
      loadTodos();
    }
  }, [user, currentSharedListId]);

  const loadTodos = async () => {
    try {
      setDataLoading(true);
      let savedTodos;
      
      if (currentSharedListId) {
        // Load todos from shared list
        savedTodos = await todoService.getTodosInSharedList(currentSharedListId);
        console.log('Loaded', savedTodos.length, 'todos from shared list');
      } else {
        // Load personal todos
        savedTodos = await todoService.getTodos();
        console.log('Loaded', savedTodos.length, 'personal todos for', user.name);
      }
      
      setTodos(savedTodos);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Set up periodic user data refresh (every 30 seconds)
  // But skip refresh if user is typing
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        // Only refresh if user is not typing
        if (!isUserTyping) {
          refreshUserData(user.email);
        }
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [user, isUserTyping]);

  const addTodo = async (text, preAnalyzed = null) => {
    setLoading(true);
    
    try {
      let todoData;
      
      if (preAnalyzed && preAnalyzed.isAnalyzed) {
        // Use pre-analyzed data from vision extraction
        todoData = {
          text,
          category: preAnalyzed.category,
          priority: preAnalyzed.priority,
          sentiment: preAnalyzed.sentiment,
          timeEstimate: preAnalyzed.timeEstimate,
          sharedListId: currentSharedListId
        };
        console.log('Using pre-analyzed data from vision:', todoData);
      } else {
        // Analyze normally
        const priority = await predictPriority(text);
        const sentiment = await analyzeSentiment(text);
        const timeEstimate = await estimateTime(text);
        let category = 'Personal';
        
        // Always try to categorize with Claude (has built-in fallback)
        category = await categorizeTask(text);
        
        todoData = {
          text,
          category,
          priority,
          sentiment,
          timeEstimate,
          sharedListId: currentSharedListId
        };
      }
      
      // Save to DynamoDB
      const savedTodo = await todoService.createTodo(todoData);
      
      // Update local state
      setTodos(prevTodos => [...prevTodos, savedTodo]);
      
      console.log('Todo saved to database:', savedTodo);
    } catch (error) {
      console.error('Error saving todo:', error);
      alert('Error saving todo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id) => {
    try {
      const todo = todos.find(t => t.todoId === id);
      if (!todo) return;
      
      const updatedTodo = await todoService.updateTodo(id, {
        completed: !todo.completed
      });
      
      setTodos(todos.map(t =>
        t.todoId === id ? updatedTodo : t
      ));
      
      console.log('Todo updated:', updatedTodo);
    } catch (error) {
      console.error('Error updating todo:', error);
      alert('Error updating todo. Please try again.');
    }
  };

  const updateTodoText = async (id, newText) => {
    try {
      const todo = todos.find(t => t.todoId === id);
      if (!todo) return;
      
      console.log('Re-analyzing todo with AI:', newText);
      
      // Re-analyze with AI
      const priority = await predictPriority(newText);
      const sentiment = await analyzeSentiment(newText);
      const timeEstimate = await estimateTime(newText);
      let category = 'Personal';
      
      // Always try to categorize with Claude (has built-in fallback)
      category = await categorizeTask(newText);
      
      // Update todo with new text and AI analysis
      const updatedTodo = await todoService.updateTodo(id, {
        text: newText,
        category,
        priority,
        sentiment,
        timeEstimate,
        completed: todo.completed
      });
      
      setTodos(todos.map(t =>
        t.todoId === id ? updatedTodo : t
      ));
      
      console.log('Todo re-analyzed and updated:', updatedTodo);
    } catch (error) {
      console.error('Error updating todo text:', error);
      throw error; // Propagate error to TodoItem component
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todoService.deleteTodo(id);
      setTodos(todos.filter(todo => todo.todoId !== id));
      console.log('Todo deleted:', id);
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Error deleting todo. Please try again.');
    }
  };

  const getTotalEstimatedTime = () => {
    const totalMinutes = todos
      .filter(todo => !todo.completed)
      .reduce((sum, todo) => sum + (todo.timeEstimate?.minutes || 0), 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setTodos([]);
    setShowAdmin(false);
  };

  const handleShowAdmin = () => {
    setShowAdmin(true);
  };

  const handleCloseAdmin = () => {
    setShowAdmin(false);
  };

  const handleSharedListChange = (listId) => {
    setCurrentSharedListId(listId);
  };

  // Show authentication form if no user
  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  if (dataLoading) {
    return (
      <div className="app">
        <h1>AI/ML To Do List</h1>
        <div className="model-loading">
          Loading your todos from the cloud...
        </div>
      </div>
    );
  }

  // Show admin dashboard if requested
  if (showAdmin && user?.isAdmin) {
    return (
      <AdminDashboard 
        currentUser={user}
        onClose={handleCloseAdmin}
      />
    );
  }

  // Get current date in a nice format
  const getCurrentDate = () => {
    const now = new Date();
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return now.toLocaleDateString('en-US', options);
  };

  return (
    <div className="app">
      <div className="app-header">
        <div className="app-header-content">
          <p className="app-date">{getCurrentDate()}</p>
          <h1 className="app-title">AI Todo</h1>
        </div>
        <UserProfile 
          user={user} 
          onLogout={handleLogout}
          onShowAdmin={handleShowAdmin}
        />
      </div>
      
      <div className="app-content">
        <SharedListSelector 
          onListChange={handleSharedListChange}
          currentListId={currentSharedListId}
        />
        <AddTodo 
          addTodo={addTodo} 
          todos={todos} 
          loading={loading}
          onTypingStart={() => setIsUserTyping(true)}
          onTypingEnd={() => setIsUserTyping(false)}
        />
        <AIInsights todos={todos} totalTime={getTotalEstimatedTime()} />
        <TodoList
          todos={todos}
          toggleTodo={toggleTodo}
          deleteTodo={deleteTodo}
          updateTodo={updateTodoText}
        />
      </div>
      
      <div className="app-footer">
        <div className="footer-stats">
          <span className="footer-stat">{todos.length} todos</span>
          <span className="footer-stat">AWS DynamoDB</span>
          <span className="footer-stat">{user.name}</span>
          {isUserTyping && (
            <span className="footer-stat typing-indicator">Auto-refresh paused</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;