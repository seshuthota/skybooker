"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Plane, User, CreditCard, Shield, Apple } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

const mockFlight = {
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
  class: "Economy",
}

interface FlightBookingFormProps {
  flightId: string
}

export function FlightBookingForm({ flightId }: FlightBookingFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [savePaymentMethod, setSavePaymentMethod] = useState(false)
  const [passengerInfo, setPassengerInfo] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    dateOfBirth: "",
    passportNumber: "",
  })

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardName: "",
    billingAddress: "",
    billingCity: "",
    billingZip: "",
    billingCountry: "",
  })

  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setPassengerInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handlePaymentChange = (field: string, value: string) => {
    setPaymentInfo((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (paymentErrors[field]) {
      setPaymentErrors((prev) => ({ ...prev, [field]: "" }))
    }

    // Format card number
    if (field === "cardNumber") {
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim()
      if (formatted.length <= 19) {
        setPaymentInfo((prev) => ({ ...prev, [field]: formatted }))
      }
      return
    }

    // Limit CVV length
    if (field === "cvv" && value.length > 4) {
      return
    }
  }

  const validatePayment = () => {
    const errors: Record<string, string> = {}

    if (paymentMethod === "card") {
      if (!paymentInfo.cardNumber.replace(/\s/g, "")) {
        errors.cardNumber = "Card number is required"
      } else if (paymentInfo.cardNumber.replace(/\s/g, "").length < 13) {
        errors.cardNumber = "Invalid card number"
      }

      if (!paymentInfo.expiryMonth) {
        errors.expiryMonth = "Expiry month is required"
      }

      if (!paymentInfo.expiryYear) {
        errors.expiryYear = "Expiry year is required"
      }

      if (!paymentInfo.cvv) {
        errors.cvv = "CVV is required"
      } else if (paymentInfo.cvv.length < 3) {
        errors.cvv = "Invalid CVV"
      }

      if (!paymentInfo.cardName.trim()) {
        errors.cardName = "Name on card is required"
      }

      if (!paymentInfo.billingAddress.trim()) {
        errors.billingAddress = "Billing address is required"
      }

      if (!paymentInfo.billingCity.trim()) {
        errors.billingCity = "City is required"
      }

      if (!paymentInfo.billingZip.trim()) {
        errors.billingZip = "ZIP code is required"
      }

      if (!paymentInfo.billingCountry) {
        errors.billingCountry = "Country is required"
      }
    }

    setPaymentErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleBooking = async () => {
    if (!validatePayment()) {
      return
    }

    setIsLoading(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Create booking record with payment info
      const booking = {
        id: Date.now().toString(),
        flightId,
        userId: user?.id,
        flight: mockFlight,
        passenger: passengerInfo,
        payment: {
          method: paymentMethod,
          last4: paymentMethod === "card" ? paymentInfo.cardNumber.slice(-4) : null,
          cardType: getCardType(paymentInfo.cardNumber),
        },
        bookingDate: new Date().toISOString(),
        status: "confirmed",
        totalPrice: mockFlight.price,
      }

      // Save booking via API
      const token = localStorage.getItem("skyBooker_token")
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          flightId: mockFlight.id,
          passengers: [
            {
              firstName: passengerInfo.firstName,
              lastName: passengerInfo.lastName,
              dateOfBirth: passengerInfo.dateOfBirth,
              passportNumber: passengerInfo.passportNumber
            }
          ],
          contactInfo: {
            email: contactInfo.email,
            phone: contactInfo.phone
          },
          paymentMethodId: paymentMethod === "card" ? "temp_card_id" : "paypal"
        })
      })

      let bookingData = booking
      if (bookingResponse.ok) {
        const apiResult = await bookingResponse.json()
        bookingData = apiResult.booking || booking
      }

      // Save payment method if requested
      if (savePaymentMethod && paymentMethod === "card") {
        try {
          await fetch(`/api/users/${user?.id}/payment-methods`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              last4: paymentInfo.cardNumber.slice(-4),
              cardType: getCardType(paymentInfo.cardNumber),
              expiryMonth: paymentInfo.expiryMonth,
              expiryYear: paymentInfo.expiryYear,
              cardName: paymentInfo.cardName,
            })
          })
        } catch (error) {
          console.error('Failed to save payment method:', error)
        }
      }

      router.push(`/bookings/confirmation/${bookingData.id}`)
    } catch (error) {
      console.error("Booking failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCardType = (cardNumber: string) => {
    const number = cardNumber.replace(/\s/g, "")
    if (number.startsWith("4")) return "Visa"
    if (number.startsWith("5") || number.startsWith("2")) return "Mastercard"
    if (number.startsWith("3")) return "American Express"
    return "Unknown"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Complete Your Booking</h1>
        <p className="text-muted-foreground">Review your flight details and enter passenger information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Passenger Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={passengerInfo.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={passengerInfo.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={passengerInfo.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={passengerInfo.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={passengerInfo.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportNumber">Passport Number</Label>
                  <Input
                    id="passportNumber"
                    value={passengerInfo.passportNumber}
                    onChange={(e) => handleInputChange("passportNumber", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="card">Credit Card</TabsTrigger>
                  <TabsTrigger value="paypal">PayPal</TabsTrigger>
                  <TabsTrigger value="apple">Apple Pay</TabsTrigger>
                </TabsList>

                <TabsContent value="card" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentInfo.cardNumber}
                      onChange={(e) => handlePaymentChange("cardNumber", e.target.value)}
                      className={paymentErrors.cardNumber ? "border-destructive" : ""}
                    />
                    {paymentErrors.cardNumber && <p className="text-sm text-destructive">{paymentErrors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryMonth">Expiry Month</Label>
                      <Select
                        value={paymentInfo.expiryMonth}
                        onValueChange={(value) => handlePaymentChange("expiryMonth", value)}
                      >
                        <SelectTrigger className={paymentErrors.expiryMonth ? "border-destructive" : ""}>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1).padStart(2, "0")}>
                              {String(i + 1).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {paymentErrors.expiryMonth && (
                        <p className="text-sm text-destructive">{paymentErrors.expiryMonth}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiryYear">Expiry Year</Label>
                      <Select
                        value={paymentInfo.expiryYear}
                        onValueChange={(value) => handlePaymentChange("expiryYear", value)}
                      >
                        <SelectTrigger className={paymentErrors.expiryYear ? "border-destructive" : ""}>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => (
                            <SelectItem key={2024 + i} value={String(2024 + i)}>
                              {2024 + i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {paymentErrors.expiryYear && (
                        <p className="text-sm text-destructive">{paymentErrors.expiryYear}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={paymentInfo.cvv}
                        onChange={(e) => handlePaymentChange("cvv", e.target.value)}
                        className={paymentErrors.cvv ? "border-destructive" : ""}
                      />
                      {paymentErrors.cvv && <p className="text-sm text-destructive">{paymentErrors.cvv}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardName">Name on Card</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={paymentInfo.cardName}
                      onChange={(e) => handlePaymentChange("cardName", e.target.value)}
                      className={paymentErrors.cardName ? "border-destructive" : ""}
                    />
                    {paymentErrors.cardName && <p className="text-sm text-destructive">{paymentErrors.cardName}</p>}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Billing Address</h4>
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress">Address</Label>
                      <Input
                        id="billingAddress"
                        placeholder="123 Main Street"
                        value={paymentInfo.billingAddress}
                        onChange={(e) => handlePaymentChange("billingAddress", e.target.value)}
                        className={paymentErrors.billingAddress ? "border-destructive" : ""}
                      />
                      {paymentErrors.billingAddress && (
                        <p className="text-sm text-destructive">{paymentErrors.billingAddress}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billingCity">City</Label>
                        <Input
                          id="billingCity"
                          placeholder="New York"
                          value={paymentInfo.billingCity}
                          onChange={(e) => handlePaymentChange("billingCity", e.target.value)}
                          className={paymentErrors.billingCity ? "border-destructive" : ""}
                        />
                        {paymentErrors.billingCity && (
                          <p className="text-sm text-destructive">{paymentErrors.billingCity}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingZip">ZIP Code</Label>
                        <Input
                          id="billingZip"
                          placeholder="10001"
                          value={paymentInfo.billingZip}
                          onChange={(e) => handlePaymentChange("billingZip", e.target.value)}
                          className={paymentErrors.billingZip ? "border-destructive" : ""}
                        />
                        {paymentErrors.billingZip && (
                          <p className="text-sm text-destructive">{paymentErrors.billingZip}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingCountry">Country</Label>
                        <Select
                          value={paymentInfo.billingCountry}
                          onValueChange={(value) => handlePaymentChange("billingCountry", value)}
                        >
                          <SelectTrigger className={paymentErrors.billingCountry ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="DE">Germany</SelectItem>
                            <SelectItem value="FR">France</SelectItem>
                          </SelectContent>
                        </Select>
                        {paymentErrors.billingCountry && (
                          <p className="text-sm text-destructive">{paymentErrors.billingCountry}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="savePayment" checked={savePaymentMethod} onCheckedChange={setSavePaymentMethod} />
                    <Label htmlFor="savePayment" className="text-sm">
                      Save this payment method for future bookings
                    </Label>
                  </div>
                </TabsContent>

                <TabsContent value="paypal" className="space-y-4">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-medium mb-2">Pay with PayPal</h3>
                    <p className="text-sm text-muted-foreground">
                      You'll be redirected to PayPal to complete your payment securely.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="apple" className="space-y-4">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Apple className="h-8 w-8 text-gray-800" />
                    </div>
                    <h3 className="font-medium mb-2">Pay with Apple Pay</h3>
                    <p className="text-sm text-muted-foreground">
                      Use Touch ID or Face ID to pay securely with Apple Pay.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Secure Payment</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your payment information is encrypted and secure. We never store your full card details.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="font-serif">Flight Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <span className="font-medium">{mockFlight.airline}</span>
                <span className="text-sm text-muted-foreground">{mockFlight.flightNumber}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">From</span>
                  <span className="font-medium">
                    {mockFlight.departure.city} ({mockFlight.departure.airport})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="font-medium">
                    {mockFlight.arrival.city} ({mockFlight.arrival.airport})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="font-medium">{mockFlight.departure.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Time</span>
                  <span className="font-medium">
                    {mockFlight.departure.time} - {mockFlight.arrival.time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-medium">{mockFlight.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Class</span>
                  <Badge variant="secondary">{mockFlight.class}</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Flight Price</span>
                  <span>${mockFlight.price}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Fees</span>
                  <span>$89</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${mockFlight.price + 89}</span>
                </div>
              </div>

              <Button onClick={handleBooking} disabled={isLoading} className="w-full" size="lg">
                {isLoading ? "Processing Payment..." : "Complete Booking"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
