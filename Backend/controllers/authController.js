const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../config/database');

// In-memory user storage for development when MongoDB is not available
const users = new Map();

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password, organization } = req.body;

      console.log('📝 Registration attempt for:', email);

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          error: 'Name, email, and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters long'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Please provide a valid email address'
        });
      }

      // Check if user already exists
      const existingUser = Array.from(users.values()).find(user => user.email === email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({
          error: 'User already exists with this email'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new user
      const userId = Date.now().toString();
      const newUser = {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        organization: organization?.trim() || '',
        role: 'user',
        createdAt: new Date(),
        lastLogin: null
      };

      users.set(userId, newUser);

      // Try to save to database if available
      try {
        const usersCollection = await database.getCollection('users');
        if (usersCollection) {
          await usersCollection.insertOne({
            _id: userId,
            ...newUser
          });
          console.log('💾 User saved to database');
        }
      } catch (dbError) {
        console.log('⚠️  Could not save to database, using memory storage');
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: userId,
          email: newUser.email,
          role: newUser.role
        },
        process.env.JWT_SECRET || 'fallback_secret_key_for_development',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      console.log('✅ User registered successfully:', email);

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: userId,
          name: newUser.name,
          email: newUser.email,
          organization: newUser.organization,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({
        error: 'Internal server error during registration'
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      console.log('🔐 Login attempt for:', email);

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required'
        });
      }

      // Find user in memory first
      let user = Array.from(users.values()).find(user => user.email === email.toLowerCase().trim());

      // If not in memory, try database
      if (!user) {
        try {
          const usersCollection = await database.getCollection('users');
          if (usersCollection) {
            const dbUser = await usersCollection.findOne({ email: email.toLowerCase().trim() });
            if (dbUser) {
              user = { ...dbUser, id: dbUser._id };
              users.set(user.id, user);
              console.log('👤 User loaded from database');
            }
          }
        } catch (dbError) {
          console.log('⚠️  Database query failed, checking memory only');
        }
      }

      if (!user) {
        console.log('❌ User not found:', email);
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log('❌ Invalid password for:', email);
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      users.set(user.id, user);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET || 'fallback_secret_key_for_development',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      console.log('✅ User logged in successfully:', email);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organization: user.organization,
          role: user.role
        }
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        error: 'Internal server error during login'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = users.get(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organization: user.organization,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const { name, organization } = req.body;
      const user = users.get(req.user.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user data
      if (name) user.name = name.trim();
      if (organization) user.organization = organization.trim();

      users.set(req.user.userId, user);

      // Update in database
      try {
        const usersCollection = await database.getCollection('users');
        if (usersCollection) {
          await usersCollection.updateOne(
            { _id: req.user.userId },
            { $set: { name: user.name, organization: user.organization } }
          );
        }
      } catch (dbError) {
        console.log('⚠️  Could not update user in database');
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organization: user.organization,
        },
      });
    } catch (error) {
      console.error('❌ Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = users.get(req.user.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify old password
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid old password' });
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
      users.set(req.user.userId, user);

      // Update in database
      try {
        const usersCollection = await database.getCollection('users');
        if (usersCollection) {
          await usersCollection.updateOne(
            { _id: req.user.userId },
            { $set: { password: hashedPassword } }
          );
        }
      } catch (dbError) {
        console.log('⚠️  Could not update password in database');
      }

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('❌ Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async logout(req, res) {
    try {
      console.log('👋 User logged out:', req.user.email);
      
      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();