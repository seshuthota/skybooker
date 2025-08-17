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
    `);

    // Create payment methods table
    await db.exec(`
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

    // Migrate existing bookings table to include new columns
    try {
      await db.exec(`
        ALTER TABLE bookings ADD COLUMN flight TEXT;
        ALTER TABLE bookings ADD COLUMN paymentMethodId TEXT;
      `);
    } catch (error) {
      // Columns may already exist, ignore error
      console.log('[DB_MIGRATION] Table columns already exist or migration failed:', error.message);
    }
  }
  return db;
}

export async function getDB() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}

// User operations
export async function getUserById(id: string) {
  const db = await getDB();
  return await db.get("SELECT * FROM users WHERE id = ?", id);
}

export async function getUserByEmail(email: string) {
  const db = await getDB();
  return await db.get("SELECT * FROM users WHERE email = ?", email);
}

export async function createUser(userData: any) {
  const db = await getDB();
  const { id, email, firstName, lastName, password, createdAt, updatedAt } = userData;
  await db.run(
    "INSERT INTO users (id, email, firstName, lastName, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    id, email, firstName, lastName, password, createdAt, updatedAt
  );
  return await getUserById(id);
}

export async function updateUser(id: string, updates: any) {
  const db = await getDB();
  const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const updateValues = Object.values(updates);
  await db.run(
    `UPDATE users SET ${updateFields}, updatedAt = ? WHERE id = ?`,
    ...updateValues, new Date().toISOString(), id
  );
  return await getUserById(id);
}

// Booking operations
export async function getBookingsByUserId(userId: string) {
  const db = await getDB();
  const bookings = await db.all("SELECT * FROM bookings WHERE userId = ?", userId);
  
  // Parse JSON fields back to objects for compatibility with dashboard
  return bookings.map((booking: any) => ({
    ...booking,
    flight: booking.flight ? JSON.parse(booking.flight) : null,
    passengers: booking.passengers ? JSON.parse(booking.passengers) : [],
    contactInfo: booking.contactInfo ? JSON.parse(booking.contactInfo) : {}
  }));
}

export async function getBookingById(id: string) {
  const db = await getDB();
  const booking = await db.get("SELECT * FROM bookings WHERE id = ?", id);
  
  if (!booking) return null;
  
  // Parse JSON fields back to objects
  return {
    ...booking,
    flight: booking.flight ? JSON.parse(booking.flight) : null,
    passengers: booking.passengers ? JSON.parse(booking.passengers) : [],
    contactInfo: booking.contactInfo ? JSON.parse(booking.contactInfo) : {}
  };
}

export async function createBooking(bookingData: any) {
  const db = await getDB();
  const { id, userId, flightId, flight, passengers, contactInfo, status, totalPrice, bookingDate, paymentMethodId } = bookingData;
  await db.run(
    "INSERT INTO bookings (id, userId, flightId, flight, passengers, contactInfo, status, totalPrice, bookingDate, paymentMethodId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    id, userId, flightId, JSON.stringify(flight), JSON.stringify(passengers), JSON.stringify(contactInfo), status, totalPrice, bookingDate, paymentMethodId
  );
  return await getBookingById(id);
}

export async function updateBooking(id: string, updates: any) {
  const db = await getDB();
  const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const updateValues = Object.values(updates);
  await db.run(
    `UPDATE bookings SET ${updateFields} WHERE id = ?`,
    ...updateValues, id
  );
  return await getBookingById(id);
}

// Payment method operations
export async function getPaymentMethodsByUserId(userId: string) {
  const db = await getDB();
  return await db.all("SELECT * FROM paymentMethods WHERE userId = ?", userId);
}

export async function createPaymentMethod(paymentMethodData: any) {
  const db = await getDB();
  const { id, userId, cardType, last4, expiryMonth, expiryYear, cardName } = paymentMethodData;
  await db.run(
    "INSERT INTO paymentMethods (id, userId, cardType, last4, expiryMonth, expiryYear, cardName) VALUES (?, ?, ?, ?, ?, ?, ?)",
    id, userId, cardType, last4, expiryMonth, expiryYear, cardName
  );
  return await db.get("SELECT * FROM paymentMethods WHERE id = ?", id);
}

export async function deletePaymentMethod(id: string) {
  const db = await getDB();
  await db.run("DELETE FROM paymentMethods WHERE id = ?", id);
  return { success: true };
}