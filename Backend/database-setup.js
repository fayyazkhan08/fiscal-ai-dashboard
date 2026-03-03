require('dotenv').config();

async function createDatabase() {
  console.log('🚀 Starting database setup...');
  
  try {
    const { MongoClient } = require('mongodb');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fiscal_dashboard';
    const DB_NAME = process.env.DB_NAME || 'fiscal_dashboard';

    console.log('📡 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');

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

    console.log('📋 Creating collections...');
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
    console.log('🔍 Creating database indexes...');
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('fiscal_data').createIndex({ state: 1, year: 1 });
      await db.collection('infrastructure_data').createIndex({ state: 1, category: 1 });
      await db.collection('sentiment_data').createIndex({ state: 1, timestamp: 1 });
      console.log('✅ Created database indexes successfully');
    } catch (error) {
      console.log('ℹ️  Some indexes may already exist:', error.message);
    }

    // Insert sample data
    console.log('📊 Inserting sample data...');
    await insertSampleData(db);
    
    await client.close();
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.log('⚠️  MongoDB connection failed - application will use in-memory storage');
    console.log('   To use MongoDB:');
    console.log('   1. Install MongoDB: https://docs.mongodb.com/manual/installation/');
    console.log('   2. Start MongoDB service');
    console.log('   3. Run this setup script again');
    console.log('');
    console.log('   Error details:', error.message);
  }
}

async function insertSampleData(db) {
  try {
    // Sample states data
    const states = [
      { code: 'MH', name: 'Maharashtra', region: 'Western', capital: 'Mumbai' },
      { code: 'KA', name: 'Karnataka', region: 'Southern', capital: 'Bengaluru' },
      { code: 'TN', name: 'Tamil Nadu', region: 'Southern', capital: 'Chennai' },
      { code: 'GJ', name: 'Gujarat', region: 'Western', capital: 'Gandhinagar' },
      { code: 'UP', name: 'Uttar Pradesh', region: 'Northern', capital: 'Lucknow' },
      { code: 'RJ', name: 'Rajasthan', region: 'Northern', capital: 'Jaipur' },
      { code: 'WB', name: 'West Bengal', region: 'Eastern', capital: 'Kolkata' },
      { code: 'AP', name: 'Andhra Pradesh', region: 'Southern', capital: 'Amaravati' }
    ];
    
    const existingStates = await db.collection('states').countDocuments();
    if (existingStates === 0) {
      await db.collection('states').insertMany(states);
      console.log('✅ Inserted sample states data');
    }

    // Sample fiscal data with realistic values
    const fiscalData = states.map(state => ({
      state: state.code,
      stateName: state.name,
      year: 2024,
      revenue: Math.floor(Math.random() * 200000) + 100000,
      expenditure: Math.floor(Math.random() * 250000) + 120000,
      fiscalDeficit: Math.floor(Math.random() * 50000) + 10000,
      gsdpGrowth: (Math.random() * 8 + 4).toFixed(2),
      infrastructureSpending: Math.floor(Math.random() * 80000) + 20000,
      debtToGSDP: (Math.random() * 25 + 15).toFixed(2),
      lastUpdated: new Date()
    }));
    
    const existingFiscal = await db.collection('fiscal_data').countDocuments();
    if (existingFiscal === 0) {
      await db.collection('fiscal_data').insertMany(fiscalData);
      console.log('✅ Inserted sample fiscal data');
    }

  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
  }
}

// Run the setup
if (require.main === module) {
  createDatabase().catch(console.error);
}

module.exports = { createDatabase };