const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/invoxl';
const targetEmail = 'amnasaliha10@gmail.com';

async function del() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const UserSchema = new mongoose.Schema({ email: String, name: String });
    const User = mongoose.model('User', UserSchema);
    
    const res = await User.deleteOne({ email: targetEmail });
    if (res.deletedCount > 0) {
      console.log(`Successfully deleted user: ${targetEmail}`);
    } else {
      console.log(`User not found: ${targetEmail}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

del();
