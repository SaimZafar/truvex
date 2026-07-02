const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const accounts = [
    { username: 'hec_admin', password: 'password123', role: 'hec' },
    { username: 'nust_admin', password: 'password123', role: 'university', institution: 'NUST' },
    { username: 'acme_corp', password: 'password123', role: 'employer' }
  ];

  for (const account of accounts) {
    const existing = await User.findOne({ username: account.username });
    if (existing) {
      console.log(`Skipping ${account.username} - already exists`);
      continue;
    }

    const hashed = await bcrypt.hash(account.password, 10);
    const user = new User({
      username: account.username,
      password: hashed,
      role: account.role,
      institution: account.institution
    });
    await user.save();
    console.log(`Created ${account.role} account: ${account.username}`);
  }

  console.log('Seeding complete.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});