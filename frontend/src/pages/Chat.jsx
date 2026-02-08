import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import {
  Send, Sparkles, User, RefreshCw, Trash2, Plus, MessageCircle, ChevronLeft,
  Target, Activity, Heart, Scale, Utensils, Dumbbell, Brain, AlertCircle
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

// Message component
function ChatMessage({ message, isUser }) {
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-gradient-to-br from-primary-400 to-secondary-500' : 'bg-gradient-to-br from-secondary-400 to-primary-500'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
      </div>
      <div className={isUser ? 'chat-message-user' : 'chat-message-assistant'}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.timestamp && (
          <p className="text-xs text-dark-500 mt-2">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-secondary-400 to-primary-500">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="chat-message-assistant">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce"></span>
          <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
          <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
        </div>
      </div>
    </div>
  )
}

// Profile Context Card
function ProfileContextCard({ profile, goals, conditions }) {
  if (!profile) return null

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/30 mb-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
          <User className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">Your Health Context</h3>
          <p className="text-xs text-dark-400">AI responses are personalized based on your profile</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {profile.age && (
          <div className="flex items-center gap-2 text-dark-300">
            <Activity className="w-4 h-4 text-primary-400" />
            <span>{profile.age} yrs</span>
          </div>
        )}
        {profile.weight && (
          <div className="flex items-center gap-2 text-dark-300">
            <Scale className="w-4 h-4 text-primary-400" />
            <span>{profile.weight} kg</span>
          </div>
        )}
        {profile.dietType && (
          <div className="flex items-center gap-2 text-dark-300">
            <Utensils className="w-4 h-4 text-secondary-400" />
            <span className="capitalize">{profile.dietType}</span>
          </div>
        )}
        {profile.activityLevel && (
          <div className="flex items-center gap-2 text-dark-300">
            <Dumbbell className="w-4 h-4 text-secondary-400" />
            <span className="capitalize">{profile.activityLevel?.replace('_', ' ')}</span>
          </div>
        )}
      </div>
      {(goals?.length > 0 || conditions?.length > 0) && (
        <div className="mt-3 pt-3 border-t border-dark-700">
          {goals?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {goals.map((g, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs">
                  {g.label || g}
                </span>
              ))}
            </div>
          )}
          {conditions?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {conditions.map((c, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-warning/20 text-warning text-xs">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Chat() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [userContext, setUserContext] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch user context
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const response = await api.get('/dashboard/context')
        if (response.data.success) {
          setUserContext(response.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch context:', err)
      }
    }
    fetchContext()
  }, [])

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/chat/conversations')
        setConversations(response.data.data || [])
      } catch (err) {
        console.error('Failed to fetch conversations:', err)
      }
    }
    fetchConversations()
  }, [])

  // Fetch personalized suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/chat/suggestions')
        setSuggestions(response.data.data || [])
      } catch (err) {
        console.error('Failed to fetch suggestions:', err)
      }
    }
    fetchSuggestions()
  }, [])

  // Fetch messages when conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation) {
        setMessages([])
        return
      }
      try {
        const response = await api.get(`/chat/conversations/${activeConversation}`)
        setMessages(response.data.data?.messages || [])
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      }
    }
    fetchMessages()
  }, [activeConversation])

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.chat-element', { opacity: 0, y: 20, stagger: 0.1, duration: 0.5, ease: 'power3.out' })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  const handleNewConversation = async () => {
    try {
      const response = await api.post('/chat/conversations')
      const newConversation = response.data.data
      setConversations(prev => [newConversation, ...prev])
      setActiveConversation(newConversation.id)
      setMessages([])
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

  const handleSendMessage = async (content = input) => {
    if (!content.trim() || isLoading) return

    let conversationId = activeConversation

    // Create new conversation if none active
    if (!conversationId) {
      try {
        const response = await api.post('/chat/conversations')
        conversationId = response.data.data.id
        setConversations(prev => [response.data.data, ...prev])
        setActiveConversation(conversationId)
      } catch (err) {
        console.error('Failed to create conversation:', err)
        return
      }
    }

    // Add user message to UI optimistically
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        message: content.trim()
      })

      // Add AI response
      const aiMessage = response.data.data?.message
      if (aiMessage) {
        setMessages(prev => [...prev, {
          id: aiMessage.id,
          role: 'assistant',
          content: aiMessage.content,
          timestamp: aiMessage.timestamp
        }])
      }

      // Update conversation title if first message
      if (messages.length === 0) {
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? { ...conv, title: content.trim().slice(0, 30) + '...' }
              : conv
          )
        )
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConversation = async (id) => {
    try {
      await api.delete(`/chat/conversations/${id}`)
      setConversations(prev => prev.filter(conv => conv.id !== id))
      if (activeConversation === id) {
        setActiveConversation(null)
        setMessages([])
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Get icon for suggestion category
  const getSuggestionIcon = (category) => {
    const icons = {
      weight_loss: Scale,
      muscle_gain: Dumbbell,
      diabetes: Heart,
      general: Brain
    }
    return icons[category] || Sparkles
  }

  return (
    <div ref={containerRef} className="h-[calc(100dvh-10rem)] sm:h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-8rem)] flex">
      {/* Sidebar - Conversations (full width overlay on mobile) */}
      <div className={`${showSidebar ? 'w-full sm:w-72 lg:w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-dark-800 flex-shrink-0 absolute sm:relative z-20 h-full ${showSidebar ? 'bg-dark-900' : ''}`}>
        <div className="h-full flex flex-col p-3 sm:p-4">
          <button onClick={handleNewConversation} className="w-full btn-primary flex items-center justify-center gap-2 mb-4">
            <Plus className="w-5 h-5" />
            New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-2">
            {conversations.map((conv) => (
              <div key={conv.id}
                className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  activeConversation === conv.id ? 'bg-primary-500/20 border border-primary-500/30' : 'hover:bg-dark-800'
                }`}
                onClick={() => setActiveConversation(conv.id)}>
                <MessageCircle className={`w-5 h-5 flex-shrink-0 ${activeConversation === conv.id ? 'text-primary-400' : 'text-dark-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`truncate ${activeConversation === conv.id ? 'text-primary-400' : 'text-dark-300'}`}>
                    {conv.title || 'New conversation'}
                  </p>
                  <p className="text-xs text-dark-500">
                    {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id) }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error/20 text-dark-500 hover:text-error transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {conversations.length === 0 && (
              <div className="text-center py-8 text-dark-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="h-14 border-b border-dark-800 flex items-center px-4 gap-3">
          <button onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 transition-all lg:hidden">
            <ChevronLeft className={`w-5 h-5 transition-transform ${showSidebar ? '' : 'rotate-180'}`} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-400 to-primary-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-medium text-white">VitalFlow AI</h2>
              <p className="text-xs text-dark-400">Your personalized health assistant</p>
            </div>
          </div>
          {userContext?.goals?.length > 0 && (
            <div className="hidden md:flex items-center gap-2 ml-auto">
              {userContext.goals.slice(0, 2).map((g, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs">
                  {g.label || g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="chat-element h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Hi {user?.firstName || 'there'}!</h2>
              <p className="text-dark-400 mb-6 max-w-md">
                I'm your AI health assistant. I know about your profile, goals, and health conditions, so my responses are personalized just for you.
              </p>

              {/* Profile Context */}
              {userContext && (
                <ProfileContextCard
                  profile={userContext.profile}
                  goals={userContext.goals}
                  conditions={userContext.conditions}
                />
              )}

              {/* Personalized Suggested Questions */}
              <div className="w-full max-w-2xl">
                <h3 className="text-sm font-medium text-dark-400 mb-3 text-left">Suggested questions for you</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestions.slice(0, 6).map((suggestion, index) => {
                    const Icon = getSuggestionIcon(suggestion.category)
                    return (
                      <button key={index} onClick={() => handleSendMessage(suggestion.question)}
                        className="p-4 rounded-xl border border-dark-700 bg-dark-800/50 hover:border-primary-500/50 hover:bg-primary-500/10 text-left transition-all group">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/30">
                            <Icon className="w-4 h-4 text-primary-400" />
                          </div>
                          <span className="text-dark-300 group-hover:text-white text-sm">{suggestion.question}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} isUser={message.role === 'user'} />
          ))}

          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 sm:p-4 border-t border-dark-800">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress} placeholder="Ask me anything..."
                className="input w-full resize-none pr-12 text-base no-zoom" rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }} />
              <button onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-dark-500 mt-2 text-center">
            VitalFlow AI provides personalized health information based on your profile. Always consult a healthcare professional for medical advice.
          </p>
        </div>
      </div>
    </div>
  )
}
