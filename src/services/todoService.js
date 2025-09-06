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
const SHARED_LISTS_TABLE = 'TodoSharedLists';

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
      subtasks: todoData.subtasks || [],
      parentTodoId: todoData.parentTodoId || null,
      sharedListId: todoData.sharedListId || null,
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
    if (updates.subtasks !== undefined) {
      updateExpression += ', subtasks = :subtasks';
      expressionAttributeValues[':subtasks'] = updates.subtasks;
    }
    if (updates.sharedListId !== undefined) {
      updateExpression += ', sharedListId = :sharedListId';
      expressionAttributeValues[':sharedListId'] = updates.sharedListId;
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
  },

  // Subtasks functionality
  async createSubtask(parentTodoId, subtaskData) {
    const subtaskId = uuidv4();
    const item = {
      userId: sessionService.getUser()?.userId || 'anonymous',
      todoId: subtaskId,
      text: subtaskData.text,
      completed: false,
      category: subtaskData.category || 'Personal',
      priority: subtaskData.priority || { level: 'normal', score: 2, color: '#2196F3' },
      sentiment: subtaskData.sentiment || { mood: 'neutral', emoji: '😐', color: '#9E9E9E', score: 0 },
      timeEstimate: subtaskData.timeEstimate || { minutes: 30, display: '30m', confidence: 'medium' },
      parentTodoId: parentTodoId,
      subtasks: [],
      sharedListId: subtaskData.sharedListId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const params = {
      TableName: TABLE_NAME,
      Item: item
    };

    try {
      await dynamodb.put(params).promise();
      
      // Update parent todo to include this subtask ID
      await this.addSubtaskToParent(parentTodoId, subtaskId);
      
      return item;
    } catch (error) {
      console.error('Error creating subtask:', error);
      throw error;
    }
  },

  async addSubtaskToParent(parentTodoId, subtaskId) {
    // Get current subtasks
    const parent = await this.getTodoById(parentTodoId);
    if (!parent) throw new Error('Parent todo not found');

    const currentSubtasks = parent.subtasks || [];
    const updatedSubtasks = [...currentSubtasks, subtaskId];

    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId: sessionService.getUser()?.userId || 'anonymous',
        todoId: parentTodoId
      },
      UpdateExpression: 'SET subtasks = :subtasks, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':subtasks': updatedSubtasks,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamodb.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error adding subtask to parent:', error);
      throw error;
    }
  },

  async getTodoById(todoId) {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId: sessionService.getUser()?.userId || 'anonymous',
        todoId: todoId
      }
    };

    try {
      const result = await dynamodb.get(params).promise();
      return result.Item;
    } catch (error) {
      console.error('Error getting todo by ID:', error);
      throw error;
    }
  },

  async getSubtasks(parentTodoId) {
    const parent = await this.getTodoById(parentTodoId);
    if (!parent || !parent.subtasks) return [];

    // Get all subtasks
    const subtaskPromises = parent.subtasks.map(subtaskId => 
      this.getTodoById(subtaskId)
    );
    
    const subtasks = await Promise.all(subtaskPromises);
    return subtasks.filter(subtask => subtask !== null);
  },

  async deleteSubtask(subtaskId, parentTodoId) {
    try {
      // Remove from parent's subtasks array
      const parent = await this.getTodoById(parentTodoId);
      if (parent && parent.subtasks) {
        const updatedSubtasks = parent.subtasks.filter(id => id !== subtaskId);
        await this.updateTodo(parentTodoId, { subtasks: updatedSubtasks });
      }

      // Delete the subtask itself
      await this.deleteTodo(subtaskId);
      return true;
    } catch (error) {
      console.error('Error deleting subtask:', error);
      throw error;
    }
  },

  // Shared Lists functionality
  async createSharedList(listData) {
    const listId = uuidv4();
    const item = {
      listId: listId,
      name: listData.name,
      description: listData.description || '',
      ownerId: sessionService.getUser()?.userId || 'anonymous',
      members: [sessionService.getUser()?.userId || 'anonymous'], // Owner is always a member
      permissions: {
        [sessionService.getUser()?.userId]: 'owner' // owner, editor, viewer
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const params = {
      TableName: SHARED_LISTS_TABLE,
      Item: item
    };

    try {
      await dynamodb.put(params).promise();
      return item;
    } catch (error) {
      console.error('Error creating shared list:', error);
      throw error;
    }
  },

  async getSharedLists() {
    const userId = sessionService.getUser()?.userId || 'anonymous';
    
    const params = {
      TableName: SHARED_LISTS_TABLE,
      FilterExpression: 'contains(members, :userId)',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    try {
      const result = await dynamodb.scan(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error getting shared lists:', error);
      throw error;
    }
  },

  async addMemberToSharedList(listId, memberUserId, permission = 'editor') {
    // Get current list
    const list = await this.getSharedListById(listId);
    if (!list) throw new Error('Shared list not found');

    // Check if user has owner permissions
    const currentUserId = sessionService.getUser()?.userId || 'anonymous';
    if (list.permissions[currentUserId] !== 'owner') {
      throw new Error('Only owners can add members');
    }

    const updatedMembers = [...new Set([...list.members, memberUserId])];
    const updatedPermissions = {
      ...list.permissions,
      [memberUserId]: permission
    };

    const params = {
      TableName: SHARED_LISTS_TABLE,
      Key: {
        listId: listId
      },
      UpdateExpression: 'SET members = :members, permissions = :permissions, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':members': updatedMembers,
        ':permissions': updatedPermissions,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamodb.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error adding member to shared list:', error);
      throw error;
    }
  },

  async getSharedListById(listId) {
    const params = {
      TableName: SHARED_LISTS_TABLE,
      Key: {
        listId: listId
      }
    };

    try {
      const result = await dynamodb.get(params).promise();
      return result.Item;
    } catch (error) {
      console.error('Error getting shared list by ID:', error);
      throw error;
    }
  },

  async getTodosInSharedList(listId) {
    const userId = sessionService.getUser()?.userId || 'anonymous';
    
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'sharedListId = :listId',
      ExpressionAttributeValues: {
        ':listId': listId
      }
    };

    try {
      const result = await dynamodb.scan(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error getting todos in shared list:', error);
      throw error;
    }
  }
};