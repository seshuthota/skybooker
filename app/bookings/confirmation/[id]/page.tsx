import { BookingConfirmation } from "@/components/bookings/booking-confirmation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default async function BookingConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <BookingConfirmation bookingId={id} />
      </main>
      <Footer />
    </div>
  )
}
