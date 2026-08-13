const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing test user
    await User.deleteMany({ email: 'demo@example.com' });

    const demoUser = await User.create({
      name: 'Demo Student',
      email: 'demo@example.com',
      password: 'password123',
      dailyStudyHours: 4,
      preferredStudyTime: 'evening',
      isOnboarded: false,
    });

    console.log('Seed Data Successfully Created!');
    console.log(`Demo User Email: ${demoUser.email}`);
    console.log('Demo User Password: password123');

    process.exit(0);
  } catch (error) {
    console.error(`Error with data import: ${error.message}`);
    process.exit(1);
  }
};

seedData();
