import { FlightSearchHero } from "@/components/flight-search-hero"
import { FeaturedDeals } from "@/components/featured-deals"
import { WhyChooseUs } from "@/components/why-choose-us"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <FlightSearchHero />
        <FeaturedDeals />
        <WhyChooseUs />
      </main>
      <Footer />
    </div>
  )
}
