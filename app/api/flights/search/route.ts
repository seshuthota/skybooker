import { type NextRequest, NextResponse } from "next/server"

// Mock flight data
const mockFlights = [
  {
    id: "FL001",
    airline: "SkyWings",
    flightNumber: "SW 1234",
    departure: { airport: "JFK", city: "New York", time: "08:00" },
    arrival: { airport: "LAX", city: "Los Angeles", time: "11:30" },
    duration: "5h 30m",
    price: 299,
    stops: 0,
    aircraft: "Boeing 737",
  },
  {
    id: "FL002",
    airline: "AirConnect",
    flightNumber: "AC 5678",
    departure: { airport: "JFK", city: "New York", time: "14:15" },
    arrival: { airport: "LAX", city: "Los Angeles", time: "17:45" },
    duration: "5h 30m",
    price: 349,
    stops: 0,
    aircraft: "Airbus A320",
  },
  {
    id: "FL003",
    airline: "Budget Air",
    flightNumber: "BA 9012",
    departure: { airport: "JFK", city: "New York", time: "06:30" },
    arrival: { airport: "LAX", city: "Los Angeles", time: "12:15" },
    duration: "7h 45m",
    price: 199,
    stops: 1,
    aircraft: "Boeing 737",
  },
]

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
    // For now, return mock data with some filtering
    let flights = [...mockFlights]

    // Simple filtering based on search params
    if (from && to) {
      flights = flights.filter(
        (flight) =>
          flight.departure.city.toLowerCase().includes(from.toLowerCase()) &&
          flight.arrival.city.toLowerCase().includes(to.toLowerCase()),
      )
    }

    return NextResponse.json({
      flights,
      searchParams: { from, to, departDate, returnDate, passengers, tripType },
    })
  } catch (error) {
    return NextResponse.json({ error: "Flight search failed" }, { status: 500 })
  }
}
