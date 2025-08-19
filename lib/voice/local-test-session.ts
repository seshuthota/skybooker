// Lightweight local test session to simulate Realtime behavior without network.
// Emits history and function_call items and executes our assistant tools directly.

type Handler = (payload?: any) => void

export class LocalTestSession {
  private handlers: Record<string, Handler[]> = {}
  public transport: any
  private tools: any[]

  constructor(agentOrConfig: any) {
    this.transport = { updateSessionConfig: (_cfg: any) => {} }
    // Agent created in RealtimeClient gets tools in config
    this.tools = (agentOrConfig && (agentOrConfig.tools || agentOrConfig?.config?.tools)) || []
  }

  on(event: string, handler: Handler) {
    ;(this.handlers[event] ||= []).push(handler)
  }

  private emit(event: string, payload?: any) {
    ;(this.handlers[event] || []).forEach(h => h(payload))
  }

  async connect(_opts?: any) {
    // Simulate immediate connect
    setTimeout(() => {
      this.emit('connected')
      this.emit('history_updated', [])
    }, 0)
  }

  close() {
    this.emit('disconnected')
  }

  sendMessage(message: any) {
    const text = typeof message === 'string'
      ? message
      : Array.isArray(message?.content)
        ? message.content.map((c: any) => c?.text).filter(Boolean).join(' ')
        : ''

    const userItemId = `u_${Date.now()}`
    this.emit('history_added', {
      type: 'message',
      role: 'user',
      status: 'completed',
      itemId: userItemId,
      content: [{ type: 'input_text', text }],
    })

    // Naive intent detection for flights search/booking
    const lower = (text || '').toLowerCase()
    if (lower.includes('search') || lower.includes('find flight') || lower.includes('find flights')) {
      this.simulateToolCall('search_flights', this.extractSearchArgs(lower))
    } else if (lower.includes('book') && lower.includes('flight')) {
      this.simulateToolCall('book_flight', this.extractBookingArgs(lower))
    } else if (lower.includes('my bookings') || lower.includes('list bookings')) {
      this.simulateToolCall('get_user_bookings', { userId: 'U1' })
    } else {
      // Generic acknowledgement
      this.emit('history_added', {
        type: 'message', role: 'assistant', status: 'completed', itemId: `a_${Date.now()}`,
        content: [{ type: 'text', text: 'Okay, tell me your travel details.' }]
      })
    }
  }

  private findTool(name: string) {
    return this.tools?.find((t: any) => t?.name === name && t?.type === 'function')
  }

  private async simulateToolCall(name: string, args: any) {
    const itemId = `t_${Date.now()}`
    // in_progress
    this.emit('history_added', {
      type: 'function_call', itemId, previousItemId: null, status: 'in_progress', name, arguments: JSON.stringify(args), output: null,
    })

    try {
      const tool = this.findTool(name)
      const output = tool ? await tool.invoke({} as any, JSON.stringify(args)) : null
      this.emit('item_update', {
        type: 'function_call', itemId, previousItemId: null, status: 'completed', name, arguments: JSON.stringify(args), output: JSON.stringify(output),
      })
      // Assistant summary
      const summary = this.summarize(name, output)
      this.emit('history_added', {
        type: 'message', role: 'assistant', status: 'completed', itemId: `a_${Date.now()}`,
        content: [{ type: 'text', text: summary }]
      })
    } catch (e) {
      // Still mark completed (without output) so upstream sees the lifecycle
      this.emit('item_update', {
        type: 'function_call', itemId, previousItemId: null, status: 'completed', name, arguments: JSON.stringify(args), output: null,
      })
      this.emit('history_added', {
        type: 'message', role: 'assistant', status: 'completed', itemId: `a_${Date.now()}`,
        content: [{ type: 'text', text: `Tool ${name} failed: ${(e as Error)?.message || e}` }]
      })
    }
  }

  private summarize(name: string, output: any): string {
    try {
      if (name === 'search_flights') {
        const results = Array.isArray(output?.results) ? output.results : output
        const n = Array.isArray(results) ? results.length : (Array.isArray(output) ? output.length : 0)
        return `I found ${n} flight option${n === 1 ? '' : 's'}.`
      }
      if (name === 'book_flight') {
        return output?.id ? `Booking created: ${output.id}` : 'Booking created.'
      }
      if (name === 'get_user_bookings') {
        const n = Array.isArray(output) ? output.length : 0
        return `You have ${n} booking${n === 1 ? '' : 's'}.`
      }
      return 'Done.'
    } catch {
      return 'Done.'
    }
  }

  private extractSearchArgs(text: string) {
    // Very naive parsing for demonstration
    const from = /from\s+([a-zA-Z]+)\b/.exec(text)?.[1] || 'New York'
    const to = /to\s+([a-zA-Z]+)\b/.exec(text)?.[1] || 'Los Angeles'
    const date = /\b(\d{4}-\d{2}-\d{2})\b/.exec(text)?.[1] || '2025-09-20'
    const pax = /\b(\d+)\s*(passenger|people|adults?)\b/.exec(text)?.[1] || '1'
    return { from, to, departDate: date, passengers: Number(pax), tripType: 'oneway' }
  }

  private extractBookingArgs(_text: string) {
    return {
      userId: 'U1',
      flightId: 'FL001',
      passengers: [{ firstName: 'Test', lastName: 'User', dateOfBirth: '1990-01-01' }],
      contact: { email: 'test@example.com', phone: '+15550000000' }
    }
  }
}
