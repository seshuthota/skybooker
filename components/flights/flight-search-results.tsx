"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plane, Clock, Wifi, Coffee, Luggage } from "lucide-react"
import { useRouter } from "next/navigation"

const mockFlights = [
  {
    id: "1",
    airline: "American Airlines",
    flightNumber: "AA 1234",
    departure: {
      airport: "JFK",
      city: "New York",
      time: "08:30",
      date: "2024-03-15",
    },
    arrival: {
      airport: "LHR",
      city: "London",
      time: "20:45",
      date: "2024-03-15",
    },
    duration: "7h 15m",
    stops: "Non-stop",
    price: 599,
    originalPrice: 799,
    class: "Economy",
    amenities: ["wifi", "meals", "entertainment"],
  },
  {
    id: "2",
    airline: "British Airways",
    flightNumber: "BA 178",
    departure: {
      airport: "JFK",
      city: "New York",
      time: "10:15",
      date: "2024-03-15",
    },
    arrival: {
      airport: "LHR",
      city: "London",
      time: "22:30",
      date: "2024-03-15",
    },
    duration: "7h 15m",
    stops: "Non-stop",
    price: 649,
    originalPrice: 849,
    class: "Economy",
    amenities: ["wifi", "meals", "entertainment", "extra-legroom"],
  },
  {
    id: "3",
    airline: "Virgin Atlantic",
    flightNumber: "VS 3",
    departure: {
      airport: "JFK",
      city: "New York",
      time: "14:20",
      date: "2024-03-15",
    },
    arrival: {
      airport: "LHR",
      city: "London",
      time: "02:35",
      date: "2024-03-16",
    },
    duration: "7h 15m",
    stops: "Non-stop",
    price: 729,
    originalPrice: 929,
    class: "Economy",
    amenities: ["wifi", "meals", "entertainment", "premium-economy-option"],
  },
]

export function FlightSearchResults() {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null)
  const router = useRouter()

  const handleBookFlight = (flightId: string) => {
    router.push(`/flights/book/${flightId}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Available Flights</h1>
        <p className="text-muted-foreground">New York (JFK) → London (LHR) • March 15, 2024 • 1 Passenger</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Price Range</h4>
                <div className="text-sm text-muted-foreground">$599 - $729</div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Airlines</h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    American Airlines
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    British Airways
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    Virgin Atlantic
                  </label>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Stops</h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    Non-stop
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />1 Stop
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {mockFlights.map((flight) => (
            <Card key={flight.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Plane className="h-5 w-5 text-primary" />
                        <span className="font-medium">{flight.airline}</span>
                        <span className="text-sm text-muted-foreground">{flight.flightNumber}</span>
                      </div>
                      <Badge variant="secondary">{flight.stops}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="text-center md:text-left">
                        <div className="text-2xl font-bold">{flight.departure.time}</div>
                        <div className="text-sm text-muted-foreground">
                          {flight.departure.airport} • {flight.departure.city}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <div className="h-px bg-border flex-1"></div>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="h-px bg-border flex-1"></div>
                        </div>
                        <div className="text-sm text-muted-foreground">{flight.duration}</div>
                      </div>

                      <div className="text-center md:text-right">
                        <div className="text-2xl font-bold">{flight.arrival.time}</div>
                        <div className="text-sm text-muted-foreground">
                          {flight.arrival.airport} • {flight.arrival.city}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      {flight.amenities.includes("wifi") && <Wifi className="h-4 w-4 text-muted-foreground" />}
                      {flight.amenities.includes("meals") && <Coffee className="h-4 w-4 text-muted-foreground" />}
                      <Luggage className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">1 carry-on included</span>
                    </div>
                  </div>

                  <div className="text-center lg:text-right">
                    <div className="mb-2">
                      <div className="text-2xl font-bold text-primary">${flight.price}</div>
                      {flight.originalPrice > flight.price && (
                        <div className="text-sm text-muted-foreground line-through">${flight.originalPrice}</div>
                      )}
                      <div className="text-sm text-muted-foreground">{flight.class}</div>
                    </div>
                    <Button onClick={() => handleBookFlight(flight.id)} className="w-full lg:w-auto">
                      Select Flight
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
