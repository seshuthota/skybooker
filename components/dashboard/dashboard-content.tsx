"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plane, Calendar, CreditCard, User, MapPin, Clock, TrendingUp, Globe } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

interface Booking {
  id: string
  flight: {
    airline: string
    flightNumber: string
    departure: {
      airport: string
      city: string
      time: string
      date: string
    }
    arrival: {
      airport: string
      city: string
      time: string
      date: string
    }
    duration: string
    class: string
  }
  status: string
  totalPrice: number
  bookingDate: string
}

export function DashboardContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState({
    activeBookings: 0,
    pastTrips: 0,
    savedCards: 0,
    totalSpent: 0,
    favoriteDestination: "None",
    milesFlown: 0,
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/signin")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      // Get user's bookings from database
      const fetchBookings = async () => {
        try {
          const response = await fetch(`/api/bookings?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            setBookings(data.bookings || [])
          } else {
            console.error('Failed to fetch bookings')
            setBookings([])
          }
        } catch (error) {
          console.error('Error fetching bookings:', error)
          setBookings([])
        }
      }
      
      fetchBookings()

      // Get saved cards
      const savedCards = JSON.parse(localStorage.getItem(`skyBooker_cards_${user.id}`) || "[]")
    }
  }, [user])

  // Calculate stats whenever bookings change
  useEffect(() => {
    if (bookings.length > 0) {
      // Calculate stats
      const now = new Date()
      const activeBookings = bookings.filter((booking: Booking) => {
        const flightDate = new Date(booking.flight.departure.date)
        return flightDate >= now && booking.status === "confirmed"
      })

      const pastTrips = bookings.filter((booking: Booking) => {
        const flightDate = new Date(booking.flight.departure.date)
        return flightDate < now && booking.status === "confirmed"
      })

      const totalSpent = bookings.reduce((sum: number, booking: Booking) => sum + booking.totalPrice, 0)

      // Calculate favorite destination
      const destinations: Record<string, number> = {}
      bookings.forEach((booking: Booking) => {
        const dest = booking.flight.arrival.city
        destinations[dest] = (destinations[dest] || 0) + 1
      })
      const favoriteDestination =
        Object.keys(destinations).length > 0
          ? Object.keys(destinations).reduce((a, b) => (destinations[a] > destinations[b] ? a : b))
          : "None"

      // Estimate miles flown (rough calculation)
      const milesFlown = pastTrips.length * 3500 // Average flight distance

      // Get saved cards (this still uses localStorage for now)
      const savedCards = JSON.parse(localStorage.getItem(`skyBooker_cards_${user?.id}`) || "[]")

      setStats({
        activeBookings: activeBookings.length,
        pastTrips: pastTrips.length,
        savedCards: savedCards.length,
        totalSpent,
        favoriteDestination,
        milesFlown,
      })
    }
  }, [bookings, user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const upcomingBookings = bookings
    .filter((booking) => {
      const flightDate = new Date(booking.flight.departure.date)
      return flightDate >= new Date() && booking.status === "confirmed"
    })
    .slice(0, 3)

  const recentActivity = bookings
    .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Welcome back, {user.firstName}!</h1>
          <p className="text-muted-foreground">Here's an overview of your travel activity and upcoming trips.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBookings}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeBookings === 0 ? "No upcoming flights" : "Upcoming flights"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Past Trips</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pastTrips}</div>
              <p className="text-xs text-muted-foreground">Completed journeys</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Lifetime travel spending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miles Flown</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.milesFlown.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Estimated distance</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Upcoming Flights */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Upcoming Flights</CardTitle>
              <CardDescription>Your next adventures await</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No upcoming flights</p>
                  <p className="text-sm mb-4">Ready for your next adventure?</p>
                  <Button asChild size="sm">
                    <Link href="/">Search Flights</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4 text-primary" />
                          <span className="font-medium">{booking.flight.airline}</span>
                          <span className="text-sm text-muted-foreground">{booking.flight.flightNumber}</span>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {booking.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">From</p>
                          <p className="font-medium">{booking.flight.departure.city}</p>
                          <p className="text-muted-foreground">
                            {booking.flight.departure.date} at {booking.flight.departure.time}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">To</p>
                          <p className="font-medium">{booking.flight.arrival.city}</p>
                          <p className="text-muted-foreground">
                            {booking.flight.arrival.date} at {booking.flight.arrival.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-muted-foreground">
                          {booking.flight.duration} • {booking.flight.class}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/bookings/confirmation/${booking.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Travel Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Travel Insights</CardTitle>
              <CardDescription>Your travel patterns and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm">Favorite Destination</span>
                </div>
                <span className="font-medium">{stats.favoriteDestination}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm">Average Trip Cost</span>
                </div>
                <span className="font-medium">
                  ${stats.pastTrips > 0 ? Math.round(stats.totalSpent / stats.pastTrips) : 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm">Travel Frequency</span>
                </div>
                <span className="font-medium">
                  {stats.pastTrips === 0
                    ? "New Traveler"
                    : stats.pastTrips < 3
                      ? "Occasional"
                      : stats.pastTrips < 10
                        ? "Regular"
                        : "Frequent"}
                </span>
              </div>

              <Separator />

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Ready to explore more?</p>
                <Button variant="outline" size="sm" asChild className="bg-transparent">
                  <Link href="/">Discover Destinations</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Quick Actions</CardTitle>
              <CardDescription>Get started with your next trip</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" asChild>
                <Link href="/">
                  <Plane className="mr-2 h-4 w-4" />
                  Search Flights
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/bookings">
                  <Calendar className="mr-2 h-4 w-4" />
                  Manage Bookings
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Update Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Recent Activity</CardTitle>
              <CardDescription>Your latest booking activity</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start by searching for flights!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((booking) => (
                    <div key={booking.id} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Booked flight to {booking.flight.arrival.city}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.bookingDate).toLocaleDateString()} • ${booking.totalPrice + 89}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button variant="ghost" size="sm" asChild className="w-full">
                      <Link href="/bookings">View All Bookings</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
