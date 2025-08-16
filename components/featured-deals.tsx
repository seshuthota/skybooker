import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plane, Clock, MapPin } from "lucide-react"

const deals = [
  {
    id: 1,
    from: "New York",
    to: "London",
    price: "$299",
    originalPrice: "$599",
    airline: "British Airways",
    duration: "7h 30m",
    stops: "Non-stop",
    image: "/london-skyline.png",
  },
  {
    id: 2,
    from: "Los Angeles",
    to: "Tokyo",
    price: "$449",
    originalPrice: "$799",
    airline: "Japan Airlines",
    duration: "11h 45m",
    stops: "Non-stop",
    image: "/vibrant-tokyo-nightscape.png",
  },
  {
    id: 3,
    from: "Miami",
    to: "Paris",
    price: "$379",
    originalPrice: "$699",
    airline: "Air France",
    duration: "8h 15m",
    stops: "Non-stop",
    image: "/paris-eiffel-tower.png",
  },
]

export function FeaturedDeals() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">Featured Flight Deals</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Don't miss out on these incredible flight deals to popular destinations around the world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <Card key={deal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={deal.image || "/placeholder.svg"}
                  alt={`${deal.to} destination`}
                  className="w-full h-48 object-cover"
                />
                <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                  Save{" "}
                  {Math.round(
                    ((Number.parseInt(deal.originalPrice.slice(1)) - Number.parseInt(deal.price.slice(1))) /
                      Number.parseInt(deal.originalPrice.slice(1))) *
                      100,
                  )}
                  %
                </Badge>
              </div>

              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-serif">
                    {deal.from} → {deal.to}
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{deal.price}</div>
                    <div className="text-sm text-muted-foreground line-through">{deal.originalPrice}</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Plane className="h-4 w-4" />
                    {deal.airline}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {deal.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {deal.stops}
                  </div>
                </div>

                <Button className="w-full">Book Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
