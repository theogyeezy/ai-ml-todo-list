import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS (same as todoService)
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'TodoUsers';

// Simple password hashing (for production, use bcrypt)
const hashPassword = (password) => {
  return btoa(password + 'todo-salt-2024'); // Simple base64 encoding
};

export const authService = {
  // Sign up a new user
  async signUp(email, password, name) {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      const user = {
        email: email.toLowerCase(),
        name: name,
        password: hashPassword(password),
        userId: uuidv4(),
        createdAt: new Date().toISOString(),
        isActive: true,
        isAdmin: email.toLowerCase() === 'matt.sam.yee@gmail.com'
      };

      const params = {
        TableName: USERS_TABLE,
        Item: user
      };

      await dynamodb.put(params).promise();
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error signing up user:', error);
      throw error;
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      if (user.password !== hashPassword(password)) {
        throw new Error('Invalid password');
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error signing in user:', error);
      throw error;
    }
  },

  // Get user by email
  async getUserByEmail(email) {
    try {
      const params = {
        TableName: USERS_TABLE,
        Key: { email: email.toLowerCase() }
      };

      const result = await dynamodb.get(params).promise();
      return result.Item || null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUser(email, updates) {
    try {
      const params = {
        TableName: USERS_TABLE,
        Key: { email: email.toLowerCase() },
        UpdateExpression: 'SET #name = :name, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': updates.name,
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamodb.update(params).promise();
      const { password: _, ...userWithoutPassword } = result.Attributes;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Admin-only functions
  async getAllUsers() {
    try {
      const params = {
        TableName: USERS_TABLE
      };

      const result = await dynamodb.scan(params).promise();
      return result.Items.map(user => {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  },

  async updateUserAdmin(email, updates) {
    try {
      let updateExpression = 'SET updatedAt = :updatedAt';
      let expressionAttributeValues = {
        ':updatedAt': new Date().toISOString()
      };
      let expressionAttributeNames = {};

      if (updates.name) {
        updateExpression += ', #name = :name';
        expressionAttributeNames['#name'] = 'name';
        expressionAttributeValues[':name'] = updates.name;
      }

      if (updates.isActive !== undefined) {
        updateExpression += ', isActive = :isActive';
        expressionAttributeValues[':isActive'] = updates.isActive;
      }

      if (updates.password) {
        updateExpression += ', #password = :password';
        expressionAttributeNames['#password'] = 'password';
        expressionAttributeValues[':password'] = hashPassword(updates.password);
      }

      const params = {
        TableName: USERS_TABLE,
        Key: { email: email.toLowerCase() },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };

      if (Object.keys(expressionAttributeNames).length > 0) {
        params.ExpressionAttributeNames = expressionAttributeNames;
      }

      const result = await dynamodb.update(params).promise();
      const { password: _, ...userWithoutPassword } = result.Attributes;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error updating user (admin):', error);
      throw error;
    }
  },

  async deleteUser(email) {
    try {
      const params = {
        TableName: USERS_TABLE,
        Key: { email: email.toLowerCase() }
      };

      await dynamodb.delete(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Fix admin status for existing user
  async setAdminStatus(email, isAdmin = true) {
    try {
      const params = {
        TableName: USERS_TABLE,
        Key: { email: email.toLowerCase() },
        UpdateExpression: 'SET isAdmin = :isAdmin, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':isAdmin': isAdmin,
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamodb.update(params).promise();
      const { password: _, ...userWithoutPassword } = result.Attributes;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error setting admin status:', error);
      throw error;
    }
  }
};

// Local storage helpers for user session
export const sessionService = {
  setUser(user) {
    localStorage.setItem('todo-user', JSON.stringify(user));
  },

  getUser() {
    const userStr = localStorage.getItem('todo-user');
    return userStr ? JSON.parse(userStr) : null;
  },

  clearUser() {
    localStorage.removeItem('todo-user');
    localStorage.removeItem('todoapp-user-id'); // Clear old user ID system
  },

  isLoggedIn() {
    return !!this.getUser();
  }
};