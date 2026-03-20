const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/invoxl';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    // We need the model
    const UserSchema = new mongoose.Schema({ email: String, name: String });
    const User = mongoose.model('User', UserSchema);
    
    const users = await User.find({}, 'email name');
    console.log('Users in DB:');
    users.forEach(u => console.log(`- ${u.email} (${u.name})`));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
