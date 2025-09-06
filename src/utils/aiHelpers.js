import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import Sentiment from 'sentiment';
import Fuse from 'fuse.js';
import nlp from 'compromise';

let model = null;

export const initializeModel = async () => {
  if (!model) {
    model = await use.load();
  }
  return model;
};

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
  
  if (model && maxScore === 0) {
    try {
      const embeddings = await model.embed([text]);
      const categoryEmbeddings = await model.embed(categories);
      
      const similarities = await tf.matMul(embeddings, categoryEmbeddings, false, true).data();
      const maxIndex = similarities.indexOf(Math.max(...similarities));
      bestCategory = categories[maxIndex];
      
      embeddings.dispose();
      categoryEmbeddings.dispose();
    } catch (error) {
      console.error('Error in ML categorization:', error);
    }
  }
  
  return bestCategory;
};

export const predictPriority = (text) => {
  const urgentKeywords = ['urgent', 'asap', 'immediately', 'now', 'today', 'emergency', 'critical', 'important'];
  const highKeywords = ['deadline', 'tomorrow', 'soon', 'priority', 'must', 'need to'];
  const lowKeywords = ['whenever', 'maybe', 'someday', 'eventually', 'if possible'];
  
  const lowerText = text.toLowerCase();
  
  let hasDeadline = false;
  try {
    const doc = nlp(text);
    hasDeadline = doc.has('#Date') || lowerText.includes('tomorrow') || lowerText.includes('today');
  } catch (error) {
    // Fallback to simple keyword detection
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
};

const sentiment = new Sentiment();

export const analyzeSentiment = (text) => {
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

export const estimateTime = (text) => {
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
};