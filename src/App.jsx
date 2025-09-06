import { useState, useEffect } from 'react';
import AddTodo from './components/AddTodo';
import TodoList from './components/TodoList';
import AIInsights from './components/AIInsights';
import AuthForm from './components/AuthForm';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import { 
  initializeModel, 
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
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

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

  // Load AI model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await initializeModel();
        setModelLoaded(true);
        console.log('AI Model loaded successfully!');
      } catch (error) {
        console.error('Error loading model:', error);
      }
    };
    loadModel();
  }, []);

  // Load todos when user changes
  useEffect(() => {
    if (user) {
      const loadTodos = async () => {
        try {
          setDataLoading(true);
          const savedTodos = await todoService.getTodos();
          setTodos(savedTodos);
          console.log('Loaded', savedTodos.length, 'todos for', user.name);
        } catch (error) {
          console.error('Error loading todos:', error);
        } finally {
          setDataLoading(false);
        }
      };
      loadTodos();
    }
  }, [user]);

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
          timeEstimate: preAnalyzed.timeEstimate
        };
        console.log('Using pre-analyzed data from vision:', todoData);
      } else {
        // Analyze normally
        const priority = predictPriority(text);
        const sentiment = analyzeSentiment(text);
        const timeEstimate = estimateTime(text);
        let category = 'Personal';
        
        if (modelLoaded) {
          category = await categorizeTask(text);
        }
        
        todoData = {
          text,
          category,
          priority,
          sentiment,
          timeEstimate
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

  // Show authentication form if no user
  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  if (dataLoading) {
    return (
      <div className="app">
        <h1>🤖 AI/ML To Do List</h1>
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

  return (
    <div className="app">
      <h1>🤖 AI/ML To Do List</h1>
      <UserProfile 
        user={user} 
        onLogout={handleLogout}
        onShowAdmin={handleShowAdmin}
      />
      {!modelLoaded && (
        <div className="model-loading">
          Loading AI models... This may take a few seconds on first load.
        </div>
      )}
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
      />
      <div className="footer-info">
        📊 {todos.length} total todos | ☁️ Saved to AWS DynamoDB | 👤 {user.name}
        {isUserTyping && <span style={{marginLeft: '10px', opacity: 0.7}}>✏️ Auto-refresh paused while typing</span>}
      </div>
    </div>
  );
}

export default App;