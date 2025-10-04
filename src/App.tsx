import React, { useState, useRef, useEffect } from 'react'

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  error?: boolean;
}

const AGENT_IDS = {
  conversation: '68e116d6615699d53b623c87',
  summarization: '68e116e33637bc8ddc9ffb63'
}

function generateRandomId() {
  return Math.random().toString(36).substring(2, 15)
}

function generateRandomUserId() {
  return `user${generateRandomId()}@test.com`
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [userId] = useState(generateRandomUserId())
  const [currentAgent, setCurrentAgent] = useState<'conversation' | 'summarization'>('conversation')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const callAgentAPI = async (agentId: string, message: string): Promise<string> => {
    const sessionId = `${agentId}-${generateRandomId()}`

    const response = await fetch('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sk-default-obhGvAo6gG9YT9tu6ChjyXLqnw7TxSGY',
      },
      body: JSON.stringify({
        user_id: userId,
        agent_id: agentId,
        session_id: sessionId,
        message: message
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Parse agent response based on agent type
    try {
      const rawContent = data.response || data.content || JSON.stringify(data)
      const parsed = JSON.parse(rawContent)

      if (agentId === AGENT_IDS.conversation) {
        return parsed.response || parsed.message || 'I received your message.'
      } else {
        return parsed.result?.summary || parsed.summary || 'Summary not available.'
      }
    } catch (error) {
      // Fallback to string response
      return data.response || data.message || 'I received your message.'
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: generateRandomId(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const agentId = currentAgent === 'conversation' ? AGENT_IDS.conversation : AGENT_IDS.summarization
      const response = await callAgentAPI(agentId, inputValue)

      const agentMessage: Message = {
        id: generateRandomId(),
        content: response,
        sender: 'agent',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, agentMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: generateRandomId(),
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        sender: 'agent',
        timestamp: new Date(),
        error: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setIsTyping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">AI Assistant</h1>
              <p className="text-blue-100 text-sm">Conversation & Summarization</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentAgent(currentAgent === 'conversation' ? 'summarization' : 'conversation')}
                className='px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-blue-700 hover:bg-blue-50'
              >
                {currentAgent === 'conversation' ? '💬 Conversation' : '📄 Summarization'}
              </button>
              <button
                onClick={handleClearChat}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>

        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-lg font-medium mb-2">
                {currentAgent === 'conversation' ? 'Start a conversation' : 'Send text to summarize'}
              </p>
              <p className="text-sm text-gray-400 text-center max-w-md">
                {currentAgent === 'conversation'
                  ? 'Ask me anything! I can help with general questions, tasks, and discussions.'
                  : 'I can provide concise summaries of your text. Just paste your content and I\'ll summarize it.'
                }
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-lg'
                        : message.error
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-lg'
                    }`}
                  >
                    <div className="break-words whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-2xl bg-white text-gray-800 border border-gray-200 rounded-bl-lg px-4 py-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <span>Typing</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  currentAgent === 'conversation'
                    ? "Type your message..."
                    : "Paste text to summarize..."
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={3}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                </svg>
                Send
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
            <span>Press Enter to send • Shift+Enter for new line</span>
            <span className="flex items-center gap-2">
              Agent: {currentAgent === 'conversation' ? '💬 Conversation' : '📄 Summarization'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App