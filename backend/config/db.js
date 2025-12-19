const mongoose = require('mongoose');

// so we cant really acces a sql db without allot of painful setup, and paying
// if anyone REALLY wants to do it, set it up and show the group before we get to coding, and we can weight both options

// so for now, we will use mongodb, which is free and easy to set up

const connectDB = async () => {
  try {
    console.log('MONGO_URI from .env:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('mongoDB connected');
  } catch (error) {
    console.error('mongoDB error', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
// there should be more error handling,but this is just to get it working for now