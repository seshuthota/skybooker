
import { z } from 'zod';
import { SearchFlightsSchema } from '../validation';

// Import the flight data and search logic directly instead of making HTTP calls
const mockFlights = [
  // NYC ↔ Los Angeles (8 flights)
  {
    id: "FL001",
    airline: "SkyWings",
    flightNumber: "SW 1234",
    departure: { airport: "JFK", city: "New York", time: "06:00" },
    arrival: { airport: "LAX", city: "Los Angeles", time: "09:30" },
    duration: "5h 30m",
    price: 299,
    stops: 0,
    aircraft: "Boeing 737",
  },
  {
    id: "FL002",
    airline: "AirConnect",
    flightNumber: "AC 5678",
    departure: { airport: "JFK", city: "New York", time: "08:15" },
    arrival: { airport: "LAX", city: "Los Angeles", time: "11:45" },
    duration: "5h 30m",
    price: 349,
    stops: 0,
    aircraft: "Airbus A320",
  },
  // NYC ↔ London (6 flights)
  {
    id: "FL009",
    airline: "British Airways",
    flightNumber: "BA 1501",
    departure: { airport: "JFK", city: "New York", time: "22:30" },
    arrival: { airport: "LHR", city: "London", time: "10:00" },
    duration: "7h 30m",
    price: 649,
    stops: 0,
    aircraft: "Boeing 777",
  },
  {
    id: "FL010",
    airline: "Virgin Atlantic",
    flightNumber: "VS 3",
    departure: { airport: "JFK", city: "New York", time: "19:15" },
    arrival: { airport: "LHR", city: "London", time: "06:45" },
    duration: "7h 30m",
    price: 699,
    stops: 0,
    aircraft: "Airbus A350",
  },
  {
    id: "FL011",
    airline: "AirConnect",
    flightNumber: "AC 4455",
    departure: { airport: "JFK", city: "New York", time: "14:30" },
    arrival: { airport: "LGW", city: "London", time: "02:00" },
    duration: "7h 30m",
    price: 599,
    stops: 0,
    aircraft: "Boeing 787",
  },
  // Add a few more popular routes
  {
    id: "FL015",
    airline: "Air India",
    flightNumber: "AI 101",
    departure: { airport: "JFK", city: "New York", time: "01:30" },
    arrival: { airport: "BOM", city: "Mumbai", time: "06:00" },
    duration: "15h 30m",
    price: 899,
    stops: 1,
    aircraft: "Boeing 787",
  },
];

// Helper function to check if flight matches location
function matchesLocation(flight: any, searchLocation: string, isDestination: boolean = false): boolean {
  const location = isDestination ? flight.arrival : flight.departure;
  const searchNormalized = searchLocation.toLowerCase();
  
  // Direct city name match
  if (location.city.toLowerCase().includes(searchNormalized)) {
    return true;
  }
  
  // Airport code match
  if (location.airport.toLowerCase() === searchLocation.toLowerCase()) {
    return true;
  }
  
  // NYC special case
  if (searchNormalized.includes('new york') || searchNormalized.includes('nyc')) {
    return ['JFK', 'LGA', 'EWR'].includes(location.airport);
  }
  
  // London special case
  if (searchNormalized.includes('london')) {
    return ['LHR', 'LGW', 'STN', 'LTN'].includes(location.airport);
  }
  
  return false;
}

// Direct flight search without HTTP calls
async function searchFlightsAPI(query: z.infer<typeof SearchFlightsSchema>) {
  const { from, to, departDate, passengers } = query;
  
  let flights = [...mockFlights];
  
  // Filter by route
  if (from && to) {
    flights = flights.filter(
      (flight) =>
        matchesLocation(flight, from, false) &&
        matchesLocation(flight, to, true)
    );
  }
  
  // Add date info if provided
  if (departDate) {
    flights = flights.map(flight => ({
      ...flight,
      departDate: departDate,
    }));
  } else {
    // No specific date - show "next available" (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    flights = flights.map(flight => ({
      ...flight,
      departDate: tomorrowString,
    }));
  }
  
  // Sort by price
  flights.sort((a, b) => a.price - b.price);
  
  return {
    flights,
    resultsCount: flights.length
  };
}

export async function searchFlights(query: z.infer<typeof SearchFlightsSchema>) {
  try {
    console.log('[FLIGHT_SEARCH] Input query:', JSON.stringify(query, null, 2))
    const validationResult = SearchFlightsSchema.safeParse(query);
    if (!validationResult.success) {
      console.error('[FLIGHT_SEARCH] Validation failed:', validationResult.error.flatten())
      return {
        success: false,
        error: 'Invalid search criteria',
        details: validationResult.error.flatten(),
      };
    }

    console.log('[FLIGHT_SEARCH] Validated data:', JSON.stringify(validationResult.data, null, 2))
    const result = await searchFlightsAPI(validationResult.data);
    console.log('[FLIGHT_SEARCH] API result:', JSON.stringify(result, null, 2))
    
    if (result.flights && result.flights.length > 0) {
      return {
        success: true,
        message: `Found ${result.flights.length} flights.`,
        data: result.flights.map((flight: any) => ({
          flightNumber: flight.flightNumber,
          departure: `${flight.departure.city} (${flight.departure.airport})`,
          arrival: `${flight.arrival.city} (${flight.arrival.airport})`,
          price: `$${flight.price}`,
          duration: flight.duration,
        })),
      };
    } else {
      return {
        success: true,
        message: 'No flights found for the selected criteria.',
        data: [],
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during flight search.',
    };
  }
}
