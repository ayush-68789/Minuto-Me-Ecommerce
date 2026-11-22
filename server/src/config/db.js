// Owner: M1
import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

let listenersAttached = false;

function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Connection established successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Connection lost. Waiting for automatic reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Reconnected successfully');
  });
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is not defined');
  }

  attachListeners();

  try {
    await mongoose.connect(uri, MONGO_OPTIONS);
    // Migrate the old globally unique email index so one person can have distinct
    // customer accounts in different stores, or a customer account and an owner account.
    let indexes;
    try {
      indexes = await User.collection.indexes();
    } catch (err) {
      if (err.code === 26 || err.codeName === 'NamespaceNotFound') indexes = [];
      else throw err;
    }
    const legacyEmailIndex = indexes.find((index) => index.name === 'email_1' && index.unique);
    if (legacyEmailIndex) await User.collection.dropIndex('email_1');
    await User.collection.createIndex(
      { email: 1, role: 1, customerStore: 1 },
      { unique: true, name: 'email_role_customerStore_unique' }
    );
  } catch (err) {
    console.error('[MongoDB] Initial connection failed:', err.message);
    throw err;
  }
};

export const isDbReady = () => mongoose.connection.readyState === 1;

export default connectDB;
