import { BookingConfirmation } from "@/components/bookings/booking-confirmation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function BookingConfirmationPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <BookingConfirmation bookingId={params.id} />
      </main>
      <Footer />
    </div>
  )
}
