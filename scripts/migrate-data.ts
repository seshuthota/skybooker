// This script should be run in the browser console or as part of a client-side initialization
// It transfers existing localStorage data to the SQLite database

async function migrateLocalStorageToDatabase() {
  try {
    console.log('Starting migration from localStorage to SQLite database...');
    
    // Get users from localStorage
    const usersData = localStorage.getItem('skyBooker_users');
    if (usersData) {
      const users = JSON.parse(usersData);
      console.log(`Found ${users.length} users to migrate`);
      
      // Send users to the API to be stored in the database
      for (const user of users) {
        try {
          const response = await fetch('/api/migrate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'user',
              data: user
            }),
          });
          
          if (!response.ok) {
            console.error(`Failed to migrate user ${user.email}`);
          } else {
            console.log(`Migrated user: ${user.email}`);
          }
        } catch (error) {
          console.error(`Error migrating user ${user.email}:`, error);
        }
      }
    }
    
    // Get bookings from localStorage
    const bookingsData = localStorage.getItem('skyBooker_bookings');
    if (bookingsData) {
      const bookings = JSON.parse(bookingsData);
      console.log(`Found ${bookings.length} bookings to migrate`);
      
      // Send bookings to the API to be stored in the database
      for (const booking of bookings) {
        try {
          const response = await fetch('/api/migrate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'booking',
              data: booking
            }),
          });
          
          if (!response.ok) {
            console.error(`Failed to migrate booking ${booking.id}`);
          } else {
            console.log(`Migrated booking: ${booking.id}`);
          }
        } catch (error) {
          console.error(`Error migrating booking ${booking.id}:`, error);
        }
      }
    }
    
    // Get payment methods from localStorage
    // We need to check all potential user IDs for payment methods
    const usersForPayments = localStorage.getItem('skyBooker_users');
    if (usersForPayments) {
      const users = JSON.parse(usersForPayments);
      
      for (const user of users) {
        const paymentMethodsData = localStorage.getItem(`skyBooker_cards_${user.id}`);
        if (paymentMethodsData) {
          const paymentMethods = JSON.parse(paymentMethodsData);
          console.log(`Found ${paymentMethods.length} payment methods for user ${user.id}`);
          
          // Send payment methods to the API to be stored in the database
          for (const paymentMethod of paymentMethods) {
            try {
              const response = await fetch('/api/migrate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'paymentMethod',
                  data: {
                    ...paymentMethod,
                    userId: user.id
                  }
                }),
              });
              
              if (!response.ok) {
                console.error(`Failed to migrate payment method ${paymentMethod.id}`);
              } else {
                console.log(`Migrated payment method: ${paymentMethod.id} for user ${user.id}`);
              }
            } catch (error) {
              console.error(`Error migrating payment method ${paymentMethod.id}:`, error);
            }
          }
        }
      }
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateLocalStorageToDatabase();