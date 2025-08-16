"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Plane, Calendar, User, Download, Mail } from "lucide-react"
import Link from "next/link"

interface BookingConfirmationProps {
  bookingId: string
}

export function BookingConfirmation({ bookingId }: BookingConfirmationProps) {
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    // Get booking from localStorage
    const bookings = JSON.parse(localStorage.getItem("skyBooker_bookings") || "[]")
    const foundBooking = bookings.find((b: any) => b.id === bookingId)
    setBooking(foundBooking)
  }, [bookingId])

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Booking not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your flight has been successfully booked. A confirmation email has been sent to {booking.passenger.email}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Flight Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{booking.flight.airline}</div>
                <div className="text-sm text-muted-foreground">{booking.flight.flightNumber}</div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                {booking.status.toUpperCase()}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Departure</div>
                <div className="font-medium">
                  {booking.flight.departure.city} ({booking.flight.departure.airport})
                </div>
                <div className="text-sm text-muted-foreground">
                  {booking.flight.departure.date} at {booking.flight.departure.time}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Arrival</div>
                <div className="font-medium">
                  {booking.flight.arrival.city} ({booking.flight.arrival.airport})
                </div>
                <div className="text-sm text-muted-foreground">
                  {booking.flight.arrival.date} at {booking.flight.arrival.time}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Duration</div>
                <div className="font-medium">{booking.flight.duration}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Class</div>
                <div className="font-medium">{booking.flight.class}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Stops</div>
                <div className="font-medium">{booking.flight.stops}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Passenger Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">
                {booking.passenger.firstName} {booking.passenger.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{booking.passenger.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{booking.passenger.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Passport</span>
              <span className="font-medium">{booking.passenger.passportNumber}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Booking Reference</span>
              <span className="font-mono font-medium">{booking.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Booking Date</span>
              <span className="font-medium">{new Date(booking.bookingDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Flight Price</span>
              <span>${booking.flight.price}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes & Fees</span>
              <span>$89</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Paid</span>
              <span className="text-primary">${booking.totalPrice + 89}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1" asChild>
            <Link href="/dashboard">
              <Calendar className="mr-2 h-4 w-4" />
              View My Bookings
            </Link>
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Download Ticket
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            <Mail className="mr-2 h-4 w-4" />
            Email Confirmation
          </Button>
        </div>
      </div>
    </div>
  )
}
