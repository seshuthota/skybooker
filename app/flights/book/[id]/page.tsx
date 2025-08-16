import { FlightBookingForm } from "@/components/flights/flight-booking-form"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function FlightBookingPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <FlightBookingForm flightId={params.id} />
      </main>
      <Footer />
    </div>
  )
}
