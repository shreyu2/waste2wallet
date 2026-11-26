import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/waste2wallet';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`❌ MongoDB Connection Error: ${error.message || error}`);
    if (error.message && error.message.includes('ECONNREFUSED')) {
      console.error('\n' + '='.repeat(60));
      console.error('⚠️  MongoDB is not running on port 27017!');
      console.error('Please start MongoDB using one of the following:');
      console.error('  1. Homebrew: brew services start mongodb-community');
      console.error('  2. Docker:   docker run -d -p 27017:27017 mongo:7.0');
      console.error('  3. Atlas:    Update MONGODB_URI in .env with your cloud DB URL');
      console.error('='.repeat(60) + '\n');
    }
    throw error;
  }
};
