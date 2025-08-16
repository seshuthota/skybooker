"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plane, Calendar, Clock, MoreHorizontal } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function BookingsList() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/signin")
      return
    }

    if (user) {
      // Get user's bookings from localStorage
      const allBookings = JSON.parse(localStorage.getItem("skyBooker_bookings") || "[]")
      const userBookings = allBookings.filter((booking: any) => booking.userId === user.id)
      setBookings(userBookings)
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">My Bookings</h1>
        <p className="text-muted-foreground">Manage your flight bookings and travel history</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-serif font-medium mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-4">Start planning your next adventure!</p>
            <Button asChild>
              <a href="/">Search Flights</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Plane className="h-5 w-5 text-primary" />
                        <span className="font-medium">{booking.flight.airline}</span>
                        <span className="text-sm text-muted-foreground">{booking.flight.flightNumber}</span>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {booking.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div>
                        <div className="text-lg font-bold">{booking.flight.departure.time}</div>
                        <div className="text-sm text-muted-foreground">
                          {booking.flight.departure.city} ({booking.flight.departure.airport})
                        </div>
                        <div className="text-sm text-muted-foreground">{booking.flight.departure.date}</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <div className="h-px bg-border flex-1"></div>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="h-px bg-border flex-1"></div>
                        </div>
                        <div className="text-sm text-muted-foreground">{booking.flight.duration}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold">{booking.flight.arrival.time}</div>
                        <div className="text-sm text-muted-foreground">
                          {booking.flight.arrival.city} ({booking.flight.arrival.airport})
                        </div>
                        <div className="text-sm text-muted-foreground">{booking.flight.arrival.date}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Booked {new Date(booking.bookingDate).toLocaleDateString()}
                      </div>
                      <div>Booking Ref: {booking.id}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <div className="text-lg font-bold text-primary">${booking.totalPrice + 89}</div>
                      <div className="text-sm text-muted-foreground">{booking.flight.class}</div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/bookings/confirmation/${booking.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Download Ticket</DropdownMenuItem>
                        <DropdownMenuItem>Email Confirmation</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Cancel Booking</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
