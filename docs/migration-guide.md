# Migration Guide: From localStorage to SQLite

This guide explains how to migrate from the localStorage-based data storage to the new SQLite database implementation.

## Overview

SkyBooker now uses SQLite for persistent data storage instead of localStorage. This provides better data integrity, querying capabilities, and scalability.

## Migration Process

### 1. Automatic Migration Script

The application includes a migration script that automatically transfers existing localStorage data to the SQLite database:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the application in your browser to populate localStorage with data

3. Run the migration script:
   ```bash
   npm run migrate
   ```

### 2. Manual Migration Steps

If you need to manually migrate data, you can use the following steps:

1. Export data from localStorage:
   ```javascript
   // In browser console
   const userData = localStorage.getItem('skyBooker_users');
   const bookingData = localStorage.getItem('skyBooker_bookings');
   const paymentData = localStorage.getItem('skyBooker_cards_USER_ID');
   ```

2. Import data to SQLite database:
   Use the provided API endpoints to import the data:
   ```bash
   curl -X POST http://localhost:3000/api/migrate \\
     -H "Content-Type: application/json" \\
     -d '{"type": "user", "data": USER_DATA}'
   ```

## Database Schema

The SQLite database uses the following schema:

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  firstName TEXT,
  lastName TEXT,
  password TEXT,
  createdAt TEXT,
  updatedAt TEXT
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
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
```

### Payment Methods Table
```sql
CREATE TABLE paymentMethods (
  id TEXT PRIMARY KEY,
  userId TEXT,
  cardType TEXT,
  last4 TEXT,
  expiryMonth TEXT,
  expiryYear TEXT,
  cardName TEXT,
  FOREIGN KEY (userId) REFERENCES users (id)
);
```

## API Endpoints

The application now uses the following API endpoints for data operations:

### User Operations
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user by ID

### Booking Operations
- `GET /api/bookings` - Get bookings by user ID
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/[id]` - Get booking by ID
- `PUT /api/bookings/[id]` - Update booking by ID
- `DELETE /api/bookings/[id]` - Cancel booking by ID

### Payment Method Operations
- `GET /api/users/[id]/payment-methods` - Get payment methods by user ID
- `POST /api/users/[id]/payment-methods` - Create new payment method
- `DELETE /api/users/[id]/payment-methods/[id]` - Delete payment method by ID

## Benefits of SQLite Migration

1. **Data Persistence**: Data is now persisted across browser sessions and device restarts
2. **Better Performance**: SQLite provides faster data access for larger datasets
3. **Query Capabilities**: Complex queries can be performed on the data
4. **Data Integrity**: Foreign key constraints ensure data consistency
5. **Scalability**: SQLite can handle larger amounts of data than localStorage
6. **Security**: Data is stored in a more secure manner than localStorage

## Troubleshooting

If you encounter issues during migration:

1. Ensure the development server is running
2. Check browser console for any errors
3. Verify that the SQLite database file (`skybooker.db`) has been created
4. If issues persist, you can manually inspect the database using any SQLite viewer

## Rollback

If you need to rollback to localStorage:

1. Comment out the database initialization code in the API routes
2. Uncomment the localStorage-based implementations
3. Remove the `skybooker.db` file if needed