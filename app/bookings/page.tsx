import { BookingsList } from "@/components/bookings/bookings-list"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function BookingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <BookingsList />
      </main>
      <Footer />
    </div>
  )
}
