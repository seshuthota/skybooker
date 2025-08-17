import { initializeDatabase, createUser, createBooking, getUserByEmail, getBookingById } from '../lib/services/database-service';

async function seedDatabase() {
  try {
    console.log('Seeding database with sample data...');
    
    // Initialize the database
    await initializeDatabase();
    
    // Create sample users
    const sampleUsers = [
      {
        id: `user_${Date.now()}_1`,
        email: `john.doe.${Date.now()}@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123', // In real app, this would be hashed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `user_${Date.now()}_2`,
        email: `jane.smith.${Date.now()}@example.com`,
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'password456', // In real app, this would be hashed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    
    for (const userData of sampleUsers) {
      try {
        // Check if user already exists
        const existingUser = await getUserByEmail(userData.email);
        if (existingUser) {
          console.log(`⚠ User ${userData.email} already exists, skipping...`);
          continue;
        }
        
        await createUser(userData);
        console.log(`✓ Created user: ${userData.email}`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error);
      }
    }
    
    // Create sample bookings
    const sampleBookings = [
      {
        id: `BK${Date.now()}`,
        userId: `user_${Date.now()}_1`,
        flightId: 'FL001',
        passengers: JSON.stringify([{ firstName: 'John', lastName: 'Doe' }]),
        contactInfo: JSON.stringify({ email: `john.doe.${Date.now()}@example.com`, phone: '+1234567890' }),
        status: 'confirmed',
        totalPrice: 299,
        bookingDate: new Date().toISOString(),
      }
    ];
    
    for (const bookingData of sampleBookings) {
      try {
        // Check if booking already exists
        const existingBooking = await getBookingById(bookingData.id);
        if (existingBooking) {
          console.log(`⚠ Booking ${bookingData.id} already exists, skipping...`);
          continue;
        }
        
        await createBooking(bookingData);
        console.log(`✓ Created booking: ${bookingData.id}`);
      } catch (error) {
        console.error(`❌ Error creating booking ${bookingData.id}:`, error);
      }
    }
    
    console.log('\n🌱 Database seeding completed!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  }
}

// Run the seeding
seedDatabase();