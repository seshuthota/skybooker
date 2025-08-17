import { type NextRequest, NextResponse } from "next/server"

// Comprehensive mock flight data covering 4 major cities with bidirectional routes
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
  {
    id: "FL003",
    airline: "Budget Air",
    flightNumber: "BA 9012",
    departure: { airport: "JFK", city: "New York", time: "12:30" },
    arrival: { airport: "LAX", city: "Los Angeles", time: "18:15" },
    duration: "7h 45m",
    price: 199,
    stops: 1,
    aircraft: "Boeing 737",
  },
  {
    id: "FL004",
    airline: "United Airlines",
    flightNumber: "UA 2045",
    departure: { airport: "JFK", city: "New York", time: "18:00" },
    arrival: { airport: "LAX", city: "Los Angeles", time: "21:30" },
    duration: "5h 30m",
    price: 399,
    stops: 0,
    aircraft: "Boeing 787",
  },
  // LA → NYC (4 flights)
  {
    id: "FL005",
    airline: "SkyWings",
    flightNumber: "SW 4321",
    departure: { airport: "LAX", city: "Los Angeles", time: "07:00" },
    arrival: { airport: "JFK", city: "New York", time: "15:30" },
    duration: "5h 30m",
    price: 319,
    stops: 0,
    aircraft: "Boeing 737",
  },
  {
    id: "FL006",
    airline: "AirConnect",
    flightNumber: "AC 8765",
    departure: { airport: "LAX", city: "Los Angeles", time: "13:15" },
    arrival: { airport: "JFK", city: "New York", time: "21:45" },
    duration: "5h 30m",
    price: 369,
    stops: 0,
    aircraft: "Airbus A320",
  },
  {
    id: "FL007",
    airline: "Budget Air",
    flightNumber: "BA 2109",
    departure: { airport: "LAX", city: "Los Angeles", time: "16:30" },
    arrival: { airport: "JFK", city: "New York", time: "03:15" },
    duration: "7h 45m",
    price: 219,
    stops: 1,
    aircraft: "Boeing 737",
  },
  {
    id: "FL008",
    airline: "United Airlines",
    flightNumber: "UA 5402",
    departure: { airport: "LAX", city: "Los Angeles", time: "22:00" },
    arrival: { airport: "JFK", city: "New York", time: "06:30" },
    duration: "5h 30m",
    price: 419,
    stops: 0,
    aircraft: "Boeing 787",
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
  // London → NYC (3 flights)
  {
    id: "FL012",
    airline: "British Airways",
    flightNumber: "BA 0183",
    departure: { airport: "LHR", city: "London", time: "11:30" },
    arrival: { airport: "JFK", city: "New York", time: "14:30" },
    duration: "8h 00m",
    price: 669,
    stops: 0,
    aircraft: "Boeing 777",
  },
  {
    id: "FL013",
    airline: "Virgin Atlantic",
    flightNumber: "VS 4",
    departure: { airport: "LHR", city: "London", time: "08:15" },
    arrival: { airport: "JFK", city: "New York", time: "11:15" },
    duration: "8h 00m",
    price: 719,
    stops: 0,
    aircraft: "Airbus A350",
  },
  {
    id: "FL014",
    airline: "AirConnect",
    flightNumber: "AC 5544",
    departure: { airport: "LGW", city: "London", time: "15:30" },
    arrival: { airport: "JFK", city: "New York", time: "18:30" },
    duration: "8h 00m",
    price: 619,
    stops: 0,
    aircraft: "Boeing 787",
  },

  // NYC ↔ Mumbai (4 flights)
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
  {
    id: "FL016",
    airline: "United Airlines",
    flightNumber: "UA 82",
    departure: { airport: "JFK", city: "New York", time: "14:45" },
    arrival: { airport: "BOM", city: "Mumbai", time: "19:15" },
    duration: "15h 30m",
    price: 1099,
    stops: 1,
    aircraft: "Boeing 777",
  },
  // Mumbai → NYC (2 flights)
  {
    id: "FL017",
    airline: "Air India",
    flightNumber: "AI 102",
    departure: { airport: "BOM", city: "Mumbai", time: "02:15" },
    arrival: { airport: "JFK", city: "New York", time: "07:45" },
    duration: "16h 30m",
    price: 919,
    stops: 1,
    aircraft: "Boeing 787",
  },
  {
    id: "FL018",
    airline: "United Airlines",
    flightNumber: "UA 83",
    departure: { airport: "BOM", city: "Mumbai", time: "21:30" },
    arrival: { airport: "JFK", city: "New York", time: "06:00" },
    duration: "16h 30m",
    price: 1119,
    stops: 1,
    aircraft: "Boeing 777",
  },

  // London ↔ Mumbai (4 flights)
  {
    id: "FL019",
    airline: "British Airways",
    flightNumber: "BA 131",
    departure: { airport: "LHR", city: "London", time: "10:30" },
    arrival: { airport: "BOM", city: "Mumbai", time: "00:30" },
    duration: "9h 00m",
    price: 799,
    stops: 0,
    aircraft: "Boeing 787",
  },
  {
    id: "FL020",
    airline: "Virgin Atlantic",
    flightNumber: "VS 355",
    departure: { airport: "LHR", city: "London", time: "21:15" },
    arrival: { airport: "BOM", city: "Mumbai", time: "11:15" },
    duration: "9h 00m",
    price: 849,
    stops: 0,
    aircraft: "Airbus A350",
  },
  // Mumbai → London (2 flights)
  {
    id: "FL021",
    airline: "British Airways",
    flightNumber: "BA 132",
    departure: { airport: "BOM", city: "Mumbai", time: "02:45" },
    arrival: { airport: "LHR", city: "London", time: "07:45" },
    duration: "9h 00m",
    price: 819,
    stops: 0,
    aircraft: "Boeing 787",
  },
  {
    id: "FL022",
    airline: "Virgin Atlantic",
    flightNumber: "VS 356",
    departure: { airport: "BOM", city: "Mumbai", time: "14:30" },
    arrival: { airport: "LHR", city: "London", time: "19:30" },
    duration: "9h 00m",
    price: 869,
    stops: 0,
    aircraft: "Airbus A350",
  },

  // London ↔ Los Angeles (4 flights)
  {
    id: "FL023",
    airline: "British Airways",
    flightNumber: "BA 269",
    departure: { airport: "LHR", city: "London", time: "11:45" },
    arrival: { airport: "LAX", city: "Los Angeles", time: "15:15" },
    duration: "11h 30m",
    price: 899,
    stops: 0,
    aircraft: "Boeing 777",
  },
  {
    id: "FL024",
    airline: "Virgin Atlantic",
    flightNumber: "VS 7",
    departure: { airport: "LHR", city: "London", time: "14:30" },
    arrival: { airport: "LAX", city: "Los Angeles", time: "18:00" },
    duration: "11h 30m",
    price: 949,
    stops: 0,
    aircraft: "Airbus A350",
  },
  // LA → London (2 flights)
  {
    id: "FL025",
    airline: "British Airways",
    flightNumber: "BA 268",
    departure: { airport: "LAX", city: "Los Angeles", time: "20:15" },
    arrival: { airport: "LHR", city: "London", time: "14:45" },
    duration: "10h 30m",
    price: 919,
    stops: 0,
    aircraft: "Boeing 777",
  },
  {
    id: "FL026",
    airline: "Virgin Atlantic",
    flightNumber: "VS 8",
    departure: { airport: "LAX", city: "Los Angeles", time: "16:45" },
    arrival: { airport: "LHR", city: "London", time: "11:15" },
    duration: "10h 30m",
    price: 969,
    stops: 0,
    aircraft: "Airbus A350",
  },

  // Mumbai ↔ Los Angeles (2 flights)
  {
    id: "FL027",
    airline: "Air India",
    flightNumber: "AI 173",
    departure: { airport: "BOM", city: "Mumbai", time: "01:15" },
    arrival: { airport: "LAX", city: "Los Angeles", time: "11:45" },
    duration: "18h 30m",
    price: 1299,
    stops: 1,
    aircraft: "Boeing 777",
  },
  // LA → Mumbai (1 flight)
  {
    id: "FL028",
    airline: "Air India",
    flightNumber: "AI 174",
    departure: { airport: "LAX", city: "Los Angeles", time: "23:30" },
    arrival: { airport: "BOM", city: "Mumbai", time: "08:00" },
    duration: "19h 30m",
    price: 1319,
    stops: 1,
    aircraft: "Boeing 777",
  },
]

// Helper function to normalize city/airport input
function normalizeLocation(input: string): string {
  const cityAirportMap: { [key: string]: string[] } = {
    'new york': ['JFK', 'LGA', 'EWR', 'NYC'],
    'nyc': ['JFK', 'LGA', 'EWR', 'NEW YORK'],
    'london': ['LHR', 'LGW', 'STN', 'LTN'],
    'mumbai': ['BOM'],
    'los angeles': ['LAX'],
    'la': ['LAX', 'LOS ANGELES']
  }
  
  const normalized = input.toLowerCase().trim()
  
  // Check if it's a mapped city
  if (cityAirportMap[normalized]) {
    return normalized
  }
  
  // Check if it's an airport code
  for (const [city, airports] of Object.entries(cityAirportMap)) {
    if (airports.includes(input.toUpperCase())) {
      return city
    }
  }
  
  return normalized
}

// Helper function to check if flight matches location
function matchesLocation(flight: any, searchLocation: string, isDestination: boolean = false): boolean {
  const location = isDestination ? flight.arrival : flight.departure
  const searchNormalized = normalizeLocation(searchLocation)
  
  // Direct city name match
  if (location.city.toLowerCase().includes(searchNormalized)) {
    return true
  }
  
  // Airport code match
  if (location.airport.toLowerCase() === searchLocation.toLowerCase()) {
    return true
  }
  
  // NYC special case - any airport in NYC area
  if (searchNormalized === 'new york' || searchNormalized === 'nyc') {
    return ['JFK', 'LGA', 'EWR'].includes(location.airport)
  }
  
  // London special case - any London airport
  if (searchNormalized === 'london') {
    return ['LHR', 'LGW', 'STN', 'LTN'].includes(location.airport)
  }
  
  return false
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const departDate = searchParams.get("departDate")
    const returnDate = searchParams.get("returnDate")
    const passengers = searchParams.get("passengers")
    const tripType = searchParams.get("tripType")

    // In a real app, this would query a flight database
    // For now, return mock data with enhanced filtering
    let flights = [...mockFlights]

    // Enhanced filtering based on search params
    if (from && to) {
      // Special case: If someone searches for Iceland, suggest London as alternative
      if (to.toLowerCase().includes('iceland')) {
        flights = flights.filter(flight => 
          matchesLocation(flight, from, false) &&
          matchesLocation(flight, 'london', true)
        )
        // Add a helpful message in the response
        return NextResponse.json({
          flights,
          searchParams: { from, to, departDate, returnDate, passengers, tripType },
          resultsCount: flights.length,
          message: `No direct flights to Iceland found. Showing flights to London as an alternative. You can find connecting flights to Iceland from London.`
        })
      }
      
      flights = flights.filter(
        (flight) =>
          matchesLocation(flight, from, false) &&
          matchesLocation(flight, to, true)
      )
    }

    // Date filtering (for now, just simulate different flights on different dates)
    if (departDate) {
      // For simulation, we'll return all flights but add date information
      flights = flights.map(flight => ({
        ...flight,
        departDate: departDate,
        // Add some price variation based on date
        price: flight.price + (Math.random() > 0.5 ? Math.floor(Math.random() * 100) : 0)
      }))
    } else {
      // No specific date - show "next available" flights (tomorrow)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = tomorrow.toISOString().split('T')[0]
      
      flights = flights.map(flight => ({
        ...flight,
        departDate: tomorrowString,
        // Slightly lower prices for next available
        price: Math.max(flight.price - Math.floor(Math.random() * 50), flight.price * 0.8)
      }))
    }

    // Passenger count filtering (adjust pricing)
    if (passengers) {
      const passengerCount = parseInt(passengers) || 1
      flights = flights.map(flight => ({
        ...flight,
        totalPrice: flight.price * passengerCount,
        passengerCount
      }))
    }

    // Sort by price for better user experience
    flights.sort((a, b) => a.price - b.price)

    return NextResponse.json({
      flights,
      searchParams: { from, to, departDate, returnDate, passengers, tripType },
      resultsCount: flights.length
    })
  } catch (error) {
    console.error('Flight search error:', error)
    return NextResponse.json({ error: "Flight search failed" }, { status: 500 })
  }
}
