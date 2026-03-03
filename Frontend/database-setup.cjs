require('dotenv').config();

async function createDatabase() {
  console.log('🚀 Starting database setup...');
  
  // Check if MongoDB is available
  try {
    const { MongoClient } = require('mongodb');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fiscal_dashboard';
    const DB_NAME = process.env.DB_NAME || 'fiscal_dashboard';

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);

    // Create collections
    const collections = [
      'users',
      'states',
      'fiscal_data',
      'infrastructure_data', 
      'sentiment_data',
      'ai_suggestions',
      'forecasts'
    ];

    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️  Collection ${collectionName} already exists`);
        } else {
          console.error(`❌ Error creating collection ${collectionName}:`, error.message);
        }
      }
    }

    // Create indexes for better performance
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('fiscal_data').createIndex({ state: 1, year: 1 });
      await db.collection('infrastructure_data').createIndex({ state: 1, category: 1 });
      await db.collection('sentiment_data').createIndex({ state: 1, timestamp: 1 });
      console.log('✅ Created database indexes');
    } catch (error) {
      console.log('ℹ️  Indexes may already exist:', error.message);
    }

    // Insert sample data
    await insertSampleData(db);
    
    await client.close();
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.log('⚠️  MongoDB not available, application will use in-memory storage');
    console.log('   To use MongoDB, ensure it is installed and running on your system');
    console.log('   Error:', error.message);
  }
}

async function insertSampleData(db) {
  try {
    // Sample states data
    const states = [
      { code: 'MH', name: 'Maharashtra', region: 'Western' },
      { code: 'KA', name: 'Karnataka', region: 'Southern' },
      { code: 'TN', name: 'Tamil Nadu', region: 'Southern' },
      { code: 'GJ', name: 'Gujarat', region: 'Western' },
      { code: 'UP', name: 'Uttar Pradesh', region: 'Northern' }
    ];
    
    const existingStates = await db.collection('states').countDocuments();
    if (existingStates === 0) {
      await db.collection('states').insertMany(states);
      console.log('✅ Inserted sample states data');
    }

    // Sample fiscal data
    const fiscalData = states.map(state => ({
      state: state.code,
      stateName: state.name,
      year: 2024,
      revenue: Math.floor(Math.random() * 100000) + 50000,
      expenditure: Math.floor(Math.random() * 120000) + 60000,
      fiscalDeficit: Math.floor(Math.random() * 20000) + 5000,
      gsdpGrowth: (Math.random() * 10 + 2).toFixed(2),
      infrastructureSpending: Math.floor(Math.random() * 30000) + 10000,
      lastUpdated: new Date()
    }));
    
    const existingFiscal = await db.collection('fiscal_data').countDocuments();
    if (existingFiscal === 0) {
      await db.collection('fiscal_data').insertMany(fiscalData);
      console.log('✅ Inserted sample fiscal data');
    }
  } catch (error) {
    console.error('Error inserting sample data:', error.message);
  }
}

// Run the setup
if (require.main === module) {
  createDatabase().catch(console.error);
}

module.exports = { createDatabase };  