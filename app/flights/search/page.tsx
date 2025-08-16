import { FlightSearchResults } from "@/components/flights/flight-search-results"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function FlightSearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <FlightSearchResults />
      </main>
      <Footer />
    </div>
  )
}
