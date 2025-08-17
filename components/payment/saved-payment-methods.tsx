"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Trash2, Plus } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface SavedCard {
  id: string
  last4: string
  cardType: string
  expiryMonth: string
  expiryYear: string
  cardName: string
}

export function SavedPaymentMethods() {
  const { user } = useAuth()
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])

  useEffect(() => {
    if (user) {
      const fetchPaymentMethods = async () => {
        try {
          const token = localStorage.getItem("skyBooker_token")
          const response = await fetch(`/api/users/${user.id}/payment-methods`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            setSavedCards(data.paymentMethods || [])
          }
        } catch (error) {
          console.error('Error fetching payment methods:', error)
          setSavedCards([])
        }
      }
      
      fetchPaymentMethods()
    }
  }, [user])

  const removeCard = async (cardId: string) => {
    try {
      const token = localStorage.getItem("skyBooker_token")
      const response = await fetch(`/api/users/${user?.id}/payment-methods`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ paymentMethodId: cardId })
      })
      
      if (response.ok) {
        const updatedCards = savedCards.filter((card) => card.id !== cardId)
        setSavedCards(updatedCards)
      } else {
        console.error('Failed to remove payment method')
      }
    } catch (error) {
      console.error('Error removing payment method:', error)
    }
  }

  const getCardIcon = (cardType: string) => {
    return <CreditCard className="h-5 w-5" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Saved Payment Methods</span>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {savedCards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No saved payment methods</p>
            <p className="text-sm">Add a card to make future bookings faster</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedCards.map((card) => (
              <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getCardIcon(card.cardType)}
                  <div>
                    <div className="font-medium">
                      {card.cardType} •••• {card.last4}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expires {card.expiryMonth}/{card.expiryYear} • {card.cardName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Default</Badge>
                  <Button variant="ghost" size="sm" onClick={() => removeCard(card.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
