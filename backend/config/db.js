const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGO_URI || process.env.DATABASE_API_KEY;
    const maskedUri = dbUri ? dbUri.replace(/:([^@]+)@/, ':****@') : 'undefined';
    console.log(`📡 Connecting to database: ${maskedUri}`);
    const conn = await mongoose.connect(dbUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {


    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
