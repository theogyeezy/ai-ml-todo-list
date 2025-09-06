import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Initialize Bedrock client for text analysis
const bedrockClient = new BedrockRuntimeClient({
  region: import.meta.env.VITE_AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: import.meta.env.VITE_BEDROCK_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_BEDROCK_SECRET_ACCESS_KEY,
  },
});

// Generic Claude analysis function
export const analyzeWithClaude = async (prompt, systemPrompt = '') => {
  try {
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    const command = new InvokeModelCommand({
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      contentType: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
      return responseBody.content[0].text.trim();
    } else {
      throw new Error('No text content in Bedrock response');
    }

  } catch (error) {
    console.error('Claude analysis error:', error);
    throw error;
  }
};

// Smart task categorization with Claude
export const categorizeTaskWithClaude = async (taskText) => {
  const systemPrompt = `You are an expert at categorizing tasks. Analyze the task and return ONLY the most appropriate category from this list: Work, Personal, Shopping, Health, Education, Finance, Home. Return just the category name, nothing else.`;
  
  const prompt = `Categorize this task: "${taskText}"`;
  
  try {
    const category = await analyzeWithClaude(prompt, systemPrompt);
    
    // Validate it's one of our categories
    const validCategories = ['Work', 'Personal', 'Shopping', 'Health', 'Education', 'Finance', 'Home'];
    if (validCategories.includes(category)) {
      return category;
    } else {
      // Fallback to best match
      const lowerCategory = category.toLowerCase();
      for (const validCat of validCategories) {
        if (lowerCategory.includes(validCat.toLowerCase())) {
          return validCat;
        }
      }
      return 'Personal'; // Default fallback
    }
  } catch (error) {
    console.error('Claude categorization failed:', error);
    throw error;
  }
};

// Smart priority prediction with Claude
export const predictPriorityWithClaude = async (taskText) => {
  const systemPrompt = `You are an expert at determining task priority. Analyze the urgency and importance of the task. Return ONLY one of these priority levels: High, Normal, Low. Consider deadlines, urgency words, and business impact. Return just the priority level, nothing else.`;
  
  const prompt = `What priority level should this task have: "${taskText}"`;
  
  try {
    const priority = await analyzeWithClaude(prompt, systemPrompt);
    
    // Validate and normalize
    const lowerPriority = priority.toLowerCase();
    if (lowerPriority.includes('high') || lowerPriority.includes('urgent')) {
      return 'High';
    } else if (lowerPriority.includes('low')) {
      return 'Low';
    } else {
      return 'Normal';
    }
  } catch (error) {
    console.error('Claude priority prediction failed:', error);
    throw error;
  }
};

// Smart sentiment analysis with Claude
export const analyzeSentimentWithClaude = async (taskText) => {
  const systemPrompt = `You are an expert at analyzing emotional sentiment in tasks. Determine if the task conveys positive, negative, or neutral sentiment. Return ONLY the sentiment (positive, negative, or neutral), nothing else.`;
  
  const prompt = `Analyze the sentiment of this task: "${taskText}"`;
  
  try {
    const sentiment = await analyzeWithClaude(prompt, systemPrompt);
    
    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes('positive')) {
      return {
        mood: 'positive',
        emoji: '😊',
        color: '#4CAF50',
        score: 3
      };
    } else if (lowerSentiment.includes('negative')) {
      return {
        mood: 'negative', 
        emoji: '😞',
        color: '#F44336',
        score: -3
      };
    } else {
      return {
        mood: 'neutral',
        emoji: '😐', 
        color: '#9E9E9E',
        score: 0
      };
    }
  } catch (error) {
    console.error('Claude sentiment analysis failed:', error);
    throw error;
  }
};

// Smart time estimation with Claude
export const estimateTimeWithClaude = async (taskText) => {
  const systemPrompt = `You are an expert at estimating how long tasks take. Based on the task description, estimate the time needed in minutes. Consider complexity, typical duration for similar tasks, and any context clues. Return ONLY a number representing minutes, nothing else.`;
  
  const prompt = `How many minutes should this task take: "${taskText}"`;
  
  try {
    const timeStr = await analyzeWithClaude(prompt, systemPrompt);
    
    // Parse the number
    const minutes = parseInt(timeStr.match(/\d+/)?.[0] || '30');
    
    // Reasonable bounds (5 minutes to 8 hours)
    const boundedMinutes = Math.max(5, Math.min(480, minutes));
    
    const hours = Math.floor(boundedMinutes / 60);
    const mins = Math.round(boundedMinutes % 60);
    
    return {
      minutes: boundedMinutes,
      display: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
      confidence: 'high'
    };
  } catch (error) {
    console.error('Claude time estimation failed:', error);
    throw error;
  }
};