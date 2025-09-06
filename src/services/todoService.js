import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { sessionService } from './authService';

// Configure AWS
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'TodoApp';

export const todoService = {
  // Create a new todo
  async createTodo(todoData) {
    const todoId = uuidv4();
    const item = {
      userId: sessionService.getUser()?.userId || 'anonymous',
      todoId: todoId,
      text: todoData.text,
      completed: false,
      category: todoData.category,
      priority: todoData.priority,
      sentiment: todoData.sentiment,
      timeEstimate: todoData.timeEstimate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const params = {
      TableName: TABLE_NAME,
      Item: item
    };

    try {
      await dynamodb.put(params).promise();
      return item;
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  },

  // Get all todos for the user
  async getTodos() {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': sessionService.getUser()?.userId || 'anonymous'
      }
    };

    try {
      const result = await dynamodb.query(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error getting todos:', error);
      throw error;
    }
  },

  // Update a todo
  async updateTodo(todoId, updates) {
    // Build update expression dynamically based on what's being updated
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues = {
      ':updatedAt': new Date().toISOString()
    };

    // Add fields to update
    if (updates.text !== undefined) {
      updateExpression += ', #text = :text';
      expressionAttributeValues[':text'] = updates.text;
    }
    if (updates.completed !== undefined) {
      updateExpression += ', completed = :completed';
      expressionAttributeValues[':completed'] = updates.completed;
    }
    if (updates.category !== undefined) {
      updateExpression += ', category = :category';
      expressionAttributeValues[':category'] = updates.category;
    }
    if (updates.priority !== undefined) {
      updateExpression += ', priority = :priority';
      expressionAttributeValues[':priority'] = updates.priority;
    }
    if (updates.sentiment !== undefined) {
      updateExpression += ', sentiment = :sentiment';
      expressionAttributeValues[':sentiment'] = updates.sentiment;
    }
    if (updates.timeEstimate !== undefined) {
      updateExpression += ', timeEstimate = :timeEstimate';
      expressionAttributeValues[':timeEstimate'] = updates.timeEstimate;
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId: sessionService.getUser()?.userId || 'anonymous',
        todoId: todoId
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    // Add ExpressionAttributeNames if updating text (reserved word in DynamoDB)
    if (updates.text !== undefined) {
      params.ExpressionAttributeNames = {
        '#text': 'text'
      };
    }

    try {
      const result = await dynamodb.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  },

  // Delete a todo
  async deleteTodo(todoId) {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId: sessionService.getUser()?.userId || 'anonymous',
        todoId: todoId
      }
    };

    try {
      await dynamodb.delete(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  },

  // Admin-only functions
  async getAllTodos() {
    const params = {
      TableName: TABLE_NAME
    };

    try {
      const result = await dynamodb.scan(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error getting all todos:', error);
      throw error;
    }
  },

  async getTodosByUserId(userId) {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    try {
      const result = await dynamodb.query(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error getting todos by user ID:', error);
      throw error;
    }
  },

  async deleteTodoAdmin(userId, todoId) {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId: userId,
        todoId: todoId
      }
    };

    try {
      await dynamodb.delete(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting todo (admin):', error);
      throw error;
    }
  },

  async updateTodoAdmin(userId, todoId, updates) {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId: userId,
        todoId: todoId
      },
      UpdateExpression: 'SET completed = :completed, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':completed': updates.completed,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamodb.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error updating todo (admin):', error);
      throw error;
    }
  }
};