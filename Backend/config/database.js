const { MongoClient } = require('mongodb');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fiscal_dashboard';
      const dbName = process.env.DB_NAME || 'fiscal_dashboard';
      
      console.log('📡 Attempting to connect to MongoDB...');
      this.client = new MongoClient(uri);
      
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;
      
      console.log('✅ Connected to MongoDB successfully');
      return this.db;
    } catch (error) {
      console.log('⚠️  MongoDB connection failed:', error.message);
      console.log('   Using in-memory storage for development');
      this.isConnected = false;
      return null;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log('📴 Disconnected from MongoDB');
    }
  }

  getDb() {
    return this.db;
  }

  async getCollection(name) {
    if (!this.isConnected || !this.db) {
      return null;
    }
    return this.db.collection(name);
  }

  isReady() {
    return this.isConnected && this.db !== null;
  }
}

const database = new Database();

// Initialize connection
database.connect().catch(console.error);

module.exports = database;