import { Database } from 'sqlite3';
import { open } from 'sqlite';

// Initialize SQLite database
let db: any = null;

export async function initializeDatabase() {
  if (!db) {
    db = await open({
      filename: './skybooker.db',
      driver: require('sqlite3').Database
    });
    
    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        firstName TEXT,
        lastName TEXT,
        password TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );
      
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        userId TEXT,
        flightId TEXT,
        passengers TEXT,
        contactInfo TEXT,
        status TEXT,
        totalPrice INTEGER,
        bookingDate TEXT,
        FOREIGN KEY (userId) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS paymentMethods (
        id TEXT PRIMARY KEY,
        userId TEXT,
        cardType TEXT,
        last4 TEXT,
        expiryMonth TEXT,
        expiryYear TEXT,
        cardName TEXT,
        FOREIGN KEY (userId) REFERENCES users (id)
      );
    `);
  }
  return db;
}

export async function getDB() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}