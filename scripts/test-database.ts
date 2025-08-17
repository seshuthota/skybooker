import { initializeDatabase, createUser, getUserByEmail } from '../lib/services/database-service';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Initialize the database
    await initializeDatabase();
    console.log('✓ Database initialized successfully');
    
    // Test creating a user with a unique email
    const timestamp = Date.now();
    const testUser = {
      id: `test_user_${timestamp}`,
      email: `test_${timestamp}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      password: 'testpassword',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('Creating test user...');
    const createdUser = await createUser(testUser);
    console.log('✓ Test user created successfully:', createdUser.email);
    
    // Test retrieving a user
    console.log('Retrieving test user...');
    const user = await getUserByEmail(`test_${timestamp}@example.com`);
    console.log('✓ Retrieved user:', user.email);
    
    console.log('\n🎉 Database test completed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Run the test
testDatabase();