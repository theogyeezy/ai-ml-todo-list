import Sentiment from 'sentiment';
import Fuse from 'fuse.js';
import nlp from 'compromise';

const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Education', 'Finance', 'Home'];

const categoryKeywords = {
  Work: ['meeting', 'email', 'deadline', 'project', 'boss', 'client', 'presentation', 'report', 'office', 'work'],
  Personal: ['call', 'friend', 'family', 'birthday', 'mom', 'dad', 'dinner', 'lunch', 'visit'],
  Shopping: ['buy', 'shop', 'groceries', 'store', 'purchase', 'order', 'amazon', 'pick up'],
  Health: ['doctor', 'appointment', 'gym', 'exercise', 'medicine', 'workout', 'run', 'dentist'],
  Education: ['study', 'learn', 'course', 'class', 'homework', 'read', 'book', 'exam', 'test'],
  Finance: ['pay', 'bill', 'bank', 'money', 'budget', 'tax', 'invoice', 'payment'],
  Home: ['clean', 'fix', 'repair', 'wash', 'laundry', 'dishes', 'organize', 'vacuum']
};

export const categorizeTask = async (text) => {
  // Try Claude 3.5 Sonnet v2 first
  try {
    const { categorizeTaskWithClaude } = await import('../services/bedrockTextService');
    return await categorizeTaskWithClaude(text);
  } catch (error) {
    console.log('Claude categorization failed, using fallback:', error.message);
    
    // Fallback to existing logic (keyword + TensorFlow)
    const lowerText = text.toLowerCase();
    
    let maxScore = 0;
    let bestCategory = 'Personal';
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          score += 1;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }
    
    // TensorFlow fallback removed - Claude handles all categorization
    
    return bestCategory;
  }
};

export const predictPriority = async (text) => {
  // Try Claude 3.5 Sonnet v2 first
  try {
    const { predictPriorityWithClaude } = await import('../services/bedrockTextService');
    const claudePriority = await predictPriorityWithClaude(text);
    
    // Convert Claude response to our format
    const priorityMap = {
      'High': { level: 'high', score: 3, color: '#ff9900' },
      'Normal': { level: 'normal', score: 2, color: '#2196F3' },
      'Low': { level: 'low', score: 1, color: '#4CAF50' }
    };
    
    return priorityMap[claudePriority] || { level: 'normal', score: 2, color: '#2196F3' };
  } catch (error) {
    console.log('Claude priority prediction failed, using fallback:', error.message);
    
    // Fallback to keyword-based priority prediction
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'now', 'today', 'emergency', 'critical', 'important'];
    const highKeywords = ['deadline', 'tomorrow', 'soon', 'priority', 'must', 'need to'];
    const lowKeywords = ['whenever', 'maybe', 'someday', 'eventually', 'if possible'];
    
    const lowerText = text.toLowerCase();
    
    let hasDeadline = false;
    try {
      const doc = nlp(text);
      hasDeadline = doc.has('#Date') || lowerText.includes('tomorrow') || lowerText.includes('today');
    } catch (err) {
      console.error('Error parsing date:', err);
      hasDeadline = lowerText.includes('tomorrow') || lowerText.includes('today') || lowerText.includes('deadline');
    }
    
    if (urgentKeywords.some(keyword => lowerText.includes(keyword))) {
      return { level: 'urgent', score: 4, color: '#ff4444' };
    }
    
    if (highKeywords.some(keyword => lowerText.includes(keyword)) || hasDeadline) {
      return { level: 'high', score: 3, color: '#ff9900' };
    }
    
    if (lowKeywords.some(keyword => lowerText.includes(keyword))) {
      return { level: 'low', score: 1, color: '#4CAF50' };
    }
    
    return { level: 'normal', score: 2, color: '#2196F3' };
  }
};

const sentiment = new Sentiment();

export const analyzeSentiment = async (text) => {
  // Try Claude 3.5 Sonnet v2 first
  try {
    const { analyzeSentimentWithClaude } = await import('../services/bedrockTextService');
    const claudeResult = await analyzeSentimentWithClaude(text);
    
    return {
      score: claudeResult.score,
      mood: claudeResult.mood,
      emoji: claudeResult.emoji,
      color: claudeResult.color,
      words: [] // Claude doesn't provide specific words
    };
  } catch (error) {
    console.log('Claude sentiment analysis failed, using fallback:', error.message);
    
    // Fallback to sentiment library
    const result = sentiment.analyze(text);
    
    let mood = 'neutral';
    let emoji = '😐';
    let color = '#9E9E9E';
    
    if (result.score > 2) {
      mood = 'positive';
      emoji = '😊';
      color = '#4CAF50';
    } else if (result.score < -2) {
      mood = 'negative';
      emoji = '😟';
      color = '#f44336';
    } else if (result.score > 0) {
      mood = 'slightly positive';
      emoji = '🙂';
      color = '#8BC34A';
    } else if (result.score < 0) {
      mood = 'slightly negative';
      emoji = '😕';
      color = '#FF9800';
    }
    
    return {
      score: result.score,
      mood,
      emoji,
      color,
      words: result.positive.concat(result.negative)
    };
  }
};

export const getSuggestions = (currentText, previousTodos) => {
  if (!currentText || currentText.length < 2) return [];
  
  const fuse = new Fuse(previousTodos, {
    keys: ['text'],
    threshold: 0.4,
    includeScore: true
  });
  
  const results = fuse.search(currentText);
  return results.slice(0, 5).map(r => r.item.text);
};

const taskTimeEstimates = {
  'email': 15,
  'meeting': 60,
  'call': 30,
  'shop': 45,
  'groceries': 60,
  'clean': 30,
  'exercise': 45,
  'gym': 60,
  'study': 90,
  'read': 30,
  'fix': 45,
  'pay bill': 10,
  'appointment': 60,
  'presentation': 120,
  'report': 90,
  'homework': 60
};

export const estimateTime = async (text) => {
  // Try Claude 3.5 Sonnet v2 first
  try {
    const { estimateTimeWithClaude } = await import('../services/bedrockTextService');
    return await estimateTimeWithClaude(text);
  } catch (error) {
    console.log('Claude time estimation failed, using fallback:', error.message);
    
    // Fallback to existing estimation logic
    const lowerText = text.toLowerCase();
    let totalMinutes = 30;
    let matched = false;
    
    for (const [task, minutes] of Object.entries(taskTimeEstimates)) {
      if (lowerText.includes(task)) {
        totalMinutes = minutes;
        matched = true;
        break;
      }
    }
    
    const doc = nlp(text);
    const numbers = doc.values().out('array');
    if (numbers.length > 0 && !matched) {
      const firstNumber = parseInt(numbers[0]);
      if (!isNaN(firstNumber) && firstNumber > 0 && firstNumber < 480) {
        totalMinutes = firstNumber;
      }
    }
    
    if (lowerText.includes('quick') || lowerText.includes('fast')) {
      totalMinutes = Math.max(5, totalMinutes * 0.5);
    } else if (lowerText.includes('long') || lowerText.includes('detailed')) {
      totalMinutes = totalMinutes * 1.5;
    }
    
    const lengthFactor = text.split(' ').length;
    if (lengthFactor > 10) {
      totalMinutes = totalMinutes * 1.2;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    
    return {
      minutes: Math.round(totalMinutes),
      display: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
      confidence: matched ? 'high' : 'medium'
    };
  }
};

// Split multiple todos from a single input
export const splitMultipleTodos = (text) => {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleanText = text.trim();
  
  // Common patterns that indicate multiple todos
  const splitPatterns = [
    // "and" separators: "do this and do that"
    /\s+and\s+(?=\w)/gi,
    // Comma separators: "buy milk, walk dog, call mom"
    /,\s*(?=\w)/g,
    // Semicolon separators: "task 1; task 2; task 3"
    /;\s*(?=\w)/g,
    // "then" separators: "do this then do that"
    /\s+then\s+(?=\w)/gi,
    // "also" separators: "buy milk also walk dog"
    /\s+also\s+(?=\w)/gi,
    // Bullet point style: "• task 1 • task 2"
    /\s*[•·*]\s*(?=\w)/g,
    // Numbered lists: "1. task 1 2. task 2"
    /\s*\d+\.\s*(?=\w)/g,
    // Dash separators: "task 1 - task 2"
    /\s*-\s*(?=\w)/g
  ];

  let todos = [cleanText];
  
  // Apply each split pattern
  for (const pattern of splitPatterns) {
    const newTodos = [];
    for (const todo of todos) {
      const splits = todo.split(pattern);
      newTodos.push(...splits);
    }
    todos = newTodos;
  }
  
  // Clean up and filter the results
  const cleanedTodos = todos
    .map(todo => todo.trim())
    .filter(todo => todo.length > 2) // Remove very short items
    .filter(todo => !todo.match(/^(and|then|also|or)$/i)) // Remove connector words
    .map(todo => {
      // Remove leading numbers, bullets, etc.
      return todo.replace(/^[\d•·*-]+\.?\s*/, '').trim();
    })
    .filter(todo => todo.length > 2); // Filter again after cleanup
  
  // If we only have one todo, return it as-is
  if (cleanedTodos.length <= 1) {
    return [cleanText];
  }
  
  // Capitalize first letter of each todo
  return cleanedTodos.map(todo => 
    todo.charAt(0).toUpperCase() + todo.slice(1).toLowerCase()
  );
};

// Enhanced helper to suggest subtasks using Claude AI
export const suggestSubtasksWithAI = async (parentTaskText) => {
  try {
    const { analyzeWithClaude } = await import('../services/bedrockTextService');
    
    const systemPrompt = `You are an expert at breaking down complex tasks into manageable subtasks. Analyze the given task and suggest 3-5 specific, actionable subtasks that would help complete the main task. Return only a JSON array of subtask strings, nothing else.`;
    
    const prompt = `Break this task into subtasks: "${parentTaskText}"`;
    
    const response = await analyzeWithClaude(prompt, systemPrompt);
    
    try {
      const subtasks = JSON.parse(response);
      if (Array.isArray(subtasks)) {
        return subtasks.slice(0, 5); // Limit to 5 subtasks max
      }
    } catch (parseError) {
      console.log('Could not parse AI subtask suggestions, using fallback');
    }
    
    // Fallback to basic keyword-based subtask generation
    return generateBasicSubtasks(parentTaskText);
    
  } catch (error) {
    console.error('AI subtask suggestion failed:', error);
    return generateBasicSubtasks(parentTaskText);
  }
};

// Basic subtask generation fallback
const generateBasicSubtasks = (taskText) => {
  const lowerText = taskText.toLowerCase();
  
  // Common task patterns and their typical subtasks
  const taskPatterns = [
    {
      keywords: ['plan', 'organize', 'prepare'],
      subtasks: ['Research requirements', 'Create outline', 'Set timeline', 'Gather resources']
    },
    {
      keywords: ['write', 'create', 'develop'],
      subtasks: ['Draft initial version', 'Review and edit', 'Get feedback', 'Finalize']
    },
    {
      keywords: ['meeting', 'call', 'interview'],
      subtasks: ['Prepare agenda', 'Send invites', 'Gather materials', 'Follow up afterwards']
    },
    {
      keywords: ['buy', 'purchase', 'shop'],
      subtasks: ['Make shopping list', 'Check prices', 'Go to store', 'Compare options']
    },
    {
      keywords: ['learn', 'study', 'research'],
      subtasks: ['Find resources', 'Take notes', 'Practice exercises', 'Test understanding']
    }
  ];
  
  for (const pattern of taskPatterns) {
    if (pattern.keywords.some(keyword => lowerText.includes(keyword))) {
      return pattern.subtasks.slice(0, 3);
    }
  }
  
  // Generic fallback subtasks
  return ['Start the task', 'Complete the main work', 'Review and finish'];
};