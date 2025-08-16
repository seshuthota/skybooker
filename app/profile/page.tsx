import { ProfileContent } from "@/components/profile/profile-content"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ProfileContent />
      </main>
      <Footer />
    </div>
  )
}
