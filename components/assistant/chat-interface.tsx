"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User } from "lucide-react"
import { format } from "date-fns"

interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: number
  isStreaming?: boolean
}

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isProcessing: boolean
}

export function ChatInterface({
  messages,
  onSendMessage,
  isProcessing
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue.trim())
      setInputValue("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm')
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-3" ref={scrollAreaRef}>
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar className="w-7 h-7 flex-shrink-0" data-testid={`avatar-${message.sender}`}>
                  <AvatarFallback>
                    {message.sender === 'user' ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div
                  className={`min-w-0 max-w-[300px] rounded-lg p-2.5 break-words ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex justify-between items-end gap-2">
                    <span className="text-sm whitespace-pre-wrap break-words leading-relaxed flex-1">
                      {message.content}
                    </span>
                    <span className="text-xs opacity-70 flex-shrink-0 text-right">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isProcessing && (
              <div className="flex gap-2.5">
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarFallback>
                    <Bot className="w-3.5 h-3.5" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="rounded-lg p-2.5 bg-muted">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - Always visible at bottom */}
      <div className="flex-shrink-0 border-t p-3 bg-background">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or use voice..."
            disabled={isProcessing}
            className="flex-1 h-9"
            type="text"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            size="sm"
            className="h-9 w-9 p-0"
            type="button"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}