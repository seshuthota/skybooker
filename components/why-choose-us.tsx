import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, DollarSign, Clock, Headphones } from "lucide-react"

const features = [
  {
    icon: DollarSign,
    title: "Best Price Guarantee",
    description: "We compare prices from hundreds of airlines to ensure you get the best deal every time.",
  },
  {
    icon: Shield,
    title: "Secure Booking",
    description: "Your personal and payment information is protected with bank-level security encryption.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Our customer support team is available around the clock to help with any questions or issues.",
  },
  {
    icon: Headphones,
    title: "Easy Cancellation",
    description: "Flexible cancellation policies and easy refund process for your peace of mind.",
  },
]

export function WhyChooseUs() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">Why Choose SkyBooker?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're committed to making your flight booking experience as smooth and affordable as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-serif">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
