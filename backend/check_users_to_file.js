const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/invoxl';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    
    const UserSchema = new mongoose.Schema({ email: String, name: String });
    const User = mongoose.model('User', UserSchema);
    
    const users = await User.find({}, 'email name');
    fs.writeFileSync('users_db.txt', users.map(u => `${u.email} (${u.name})`).join('\n'));
    
    process.exit(0);
  } catch (err) {
    fs.writeFileSync('users_db_err.txt', err.message);
    process.exit(1);
  }
}

check();
