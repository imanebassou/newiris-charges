import { useState, useRef, useEffect } from 'react'
import api from '../api/axios'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  modules?: string[]
}

type Tab = 'chat' | 'history'

const formatTime = (date: Date) =>
  date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const MODULE_COLORS: Record<string, string> = {
  banque: '#265dad',
  caisse: '#059669',
  charges_fixes: '#7c3aed',
  charges_variables: '#d97706',
  commandes: '#0891b2',
  fournisseurs: '#be185d',
  cheques: '#dc2626',
  salaires: '#16a34a',
  chantiers: '#92400e',
  general: '#6b7280',
}

const ChatBot = () => {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('chat')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Bonjour ! Je suis NEWIRIS AI. Je peux vous aider sur les finances, commandes, fournisseurs, chantiers et plus. Que souhaitez-vous savoir ?",
      timestamp: formatTime(new Date())
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await api.get('/chat/history/')
      setHistory(res.data)
    } catch {
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const deleteMessage = async (id: number) => {
    setDeletingId(id)
    try {
      await api.delete(`/chat/history/${id}/`)
      setHistory(prev => prev.filter(h => h.id !== id))
    } catch {
      // fallback: remove locally
      setHistory(prev => prev.filter(h => h.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, {
      role: 'user',
      content: question,
      timestamp: formatTime(new Date())
    }])
    setLoading(true)
    try {
      const res = await api.post('/chat/', { question })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.reponse,
        timestamp: formatTime(new Date()),
        modules: res.data.modules || []
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erreur de connexion. Réessayez.',
        timestamp: formatTime(new Date())
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Bonjour ! Je suis NEWIRIS AI. Comment puis-je vous aider ?",
      timestamp: formatTime(new Date())
    }])
  }

  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes bubbleGlow {
          0%, 100% { box-shadow: 0 8px 28px rgba(38,93,173,0.4), 0 0 0 0 rgba(38,93,173,0.2); }
          50% { box-shadow: 0 8px 28px rgba(38,93,173,0.5), 0 0 0 8px rgba(38,93,173,0.05); }
        }
        .dot1 { animation: dotPulse 1.4s infinite 0s; }
        .dot2 { animation: dotPulse 1.4s infinite 0.2s; }
        .dot3 { animation: dotPulse 1.4s infinite 0.4s; }
        .chat-scroll::-webkit-scrollbar { width: 3px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #d9e0e7; border-radius: 4px; }
        .msg-input:focus { border-color: #265dad !important; box-shadow: 0 0 0 3px rgba(38,93,173,0.08) !important; }
        .history-item:hover .delete-btn { opacity: 1 !important; }
        .fab-btn { animation: bubbleGlow 3s ease-in-out infinite; }
        .fab-btn:hover { transform: scale(1.06); }
        .send-btn:hover:not(:disabled) { transform: scale(1.05); }
      `}</style>

      {/* Bouton flottant — style chat bubble */}
      <button
        className={!open ? 'fab-btn' : ''}
        onClick={() => setOpen(!open)}
        title="NEWIRIS AI"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          width: '56px',
          height: '56px',
          borderRadius: '18px',
          background: open
            ? '#1d2836'
            : 'linear-gradient(145deg, #265dad 0%, #1a3f7a 100%)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'all 0.25s ease',
        }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          /* Chat bubble icon avec "yeux" comme le logo */
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="22" rx="10" fill="white" fillOpacity="0.95"/>
            <path d="M10 24 L14 28 L14 24" fill="white" fillOpacity="0.95"/>
            <rect x="9" y="8" width="4" height="8" rx="2" fill="#265dad"/>
            <rect x="19" y="8" width="4" height="8" rx="2" fill="#265dad"/>
          </svg>
        )}
      </button>

      {/* Fenêtre chat */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: '98px',
          right: '28px',
          width: '400px',
          height: '570px',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #182434 0%, #1f2d40 100%)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}>
            {/* Logo chat bubble dans header */}
            <div style={{
              width: '38px', height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(145deg, #265dad, #1a3f7a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(38,93,173,0.4)',
            }}>
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <rect x="2" y="2" width="28" height="22" rx="9" fill="white" fillOpacity="0.95"/>
                <path d="M10 24 L14 27 L14 24" fill="white" fillOpacity="0.95"/>
                <rect x="8" y="8" width="4" height="7" rx="2" fill="#265dad"/>
                <rect x="18" y="8" width="4" height="7" rx="2" fill="#265dad"/>
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.2px' }}>
                NEWIRIS AI
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '1px' }}>
                Assistant intelligent
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 0 2px rgba(34,197,94,0.2)',
                }} />
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>En ligne</span>
              </div>
              <button
                onClick={clearChat}
                title="Nouvelle conversation"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  width: '30px', height: '30px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            flexShrink: 0,
          }}>
            {(['chat', 'history'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: tab === t ? 700 : 500,
                  color: tab === t ? '#265dad' : '#9ca3af',
                  borderBottom: tab === t ? '2px solid #265dad' : '2px solid transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {t === 'chat' ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke={tab === t ? '#265dad' : '#9ca3af'} strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Conversation
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke={tab === t ? '#265dad' : '#9ca3af'} strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Historique
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Tab Chat */}
          {tab === 'chat' && (
            <>
              <div className="chat-scroll" style={{
                flex: 1, overflowY: 'auto',
                padding: '16px',
                display: 'flex', flexDirection: 'column', gap: '16px',
                background: '#f8fafc',
              }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: '4px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '8px',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: '30px', height: '30px',
                        borderRadius: '10px',
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, #cb3128, #a02020)'
                          : 'linear-gradient(145deg, #265dad, #1a3f7a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      }}>
                        {msg.role === 'user' ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                            <rect x="3" y="3" width="26" height="20" rx="8" fill="white" fillOpacity="0.95"/>
                            <path d="M11 23 L14 26 L14 23" fill="white" fillOpacity="0.95"/>
                            <rect x="8" y="8" width="3.5" height="6" rx="1.75" fill="#265dad"/>
                            <rect x="17" y="8" width="3.5" height="6" rx="1.75" fill="#265dad"/>
                          </svg>
                        )}
                      </div>

                      {/* Bulle */}
                      <div style={{
                        maxWidth: '74%',
                        padding: '11px 14px',
                        borderRadius: msg.role === 'user'
                          ? '16px 4px 16px 16px'
                          : '4px 16px 16px 16px',
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, #265dad, #1a3f7a)'
                          : '#ffffff',
                        color: msg.role === 'user' ? '#ffffff' : '#1d2836',
                        fontSize: '12.5px',
                        lineHeight: '1.65',
                        boxShadow: msg.role === 'user'
                          ? '0 4px 14px rgba(38,93,173,0.28)'
                          : '0 2px 8px rgba(0,0,0,0.06)',
                        border: msg.role === 'assistant' ? '1px solid #e5eaf0' : 'none',
                      }}>
                        {msg.content}
                      </div>
                    </div>

                    {/* Modules + timestamp */}
                    <div style={{
                      display: 'flex', gap: '4px', alignItems: 'center',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      paddingLeft: msg.role === 'assistant' ? '38px' : '0',
                      paddingRight: msg.role === 'user' ? '38px' : '0',
                    }}>
                      {msg.modules?.slice(0, 3).map(m => (
                        <span key={m} style={{
                          padding: '2px 7px', borderRadius: '4px',
                          fontSize: '10px', fontWeight: 600,
                          background: (MODULE_COLORS[m] || '#6b7280') + '15',
                          color: MODULE_COLORS[m] || '#6b7280',
                          border: `1px solid ${(MODULE_COLORS[m] || '#6b7280')}20`,
                        }}>{m}</span>
                      ))}
                      {msg.timestamp && (
                        <span style={{ fontSize: '10px', color: '#b0b8c4' }}>
                          {msg.timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '10px',
                      background: 'linear-gradient(145deg, #265dad, #1a3f7a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                        <rect x="3" y="3" width="26" height="20" rx="8" fill="white" fillOpacity="0.95"/>
                        <path d="M11 23 L14 26 L14 23" fill="white" fillOpacity="0.95"/>
                        <rect x="8" y="8" width="3.5" height="6" rx="1.75" fill="#265dad"/>
                        <rect x="17" y="8" width="3.5" height="6" rx="1.75" fill="#265dad"/>
                      </svg>
                    </div>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '4px 16px 16px 16px',
                      background: '#ffffff',
                      border: '1px solid #e5eaf0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      display: 'flex', gap: '5px', alignItems: 'center',
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} className={`dot${i + 1}`} style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          background: '#265dad',
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: '12px 14px',
                borderTop: '1px solid #f1f5f9',
                background: '#ffffff',
                display: 'flex', gap: '8px', alignItems: 'center',
                flexShrink: 0,
              }}>
                <input
                  className="msg-input"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question..."
                  disabled={loading}
                  style={{
                    flex: 1, padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #e5eaf0',
                    fontSize: '12.5px', outline: 'none',
                    background: '#f8fbff', color: '#1d2836',
                    transition: 'all 0.2s',
                  }}
                />
                <button
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '12px',
                    background: loading || !input.trim()
                      ? '#f1f5f9'
                      : 'linear-gradient(135deg, #265dad, #1a3f7a)',
                    border: 'none',
                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    boxShadow: loading || !input.trim() ? 'none' : '0 4px 12px rgba(38,93,173,0.3)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke={loading || !input.trim() ? '#9ca3af' : '#fff'} strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </>
          )}

          {/* Tab Historique */}
          {tab === 'history' && (
            <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
              {loadingHistory ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '100%', color: '#9ca3af', fontSize: '13px', gap: '8px',
                }}>
                  <div className="dot1" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#265dad' }} />
                  <div className="dot2" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#265dad' }} />
                  <div className="dot3" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#265dad' }} />
                </div>
              ) : history.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  height: '100%', gap: '12px',
                }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '16px',
                    background: '#e5eaf0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Aucun historique disponible</div>
                </div>
              ) : (
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="history-item"
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        border: '1px solid #e5eaf0',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        position: 'relative',
                      }}
                      onClick={() => {
                        setMessages(prev => [
                          ...prev,
                          { role: 'user', content: item.question, timestamp: formatTime(new Date()) },
                          { role: 'assistant', content: item.reponse, timestamp: formatTime(new Date()), modules: item.modules }
                        ])
                        setTab('chat')
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#265dad')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5eaf0')}
                    >
                      {/* Bouton supprimer */}
                      <button
                        className="delete-btn"
                        onClick={e => { e.stopPropagation(); deleteMessage(item.id) }}
                        title="Supprimer"
                        style={{
                          position: 'absolute',
                          top: '10px', right: '10px',
                          width: '24px', height: '24px',
                          borderRadius: '6px',
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: deletingId === item.id ? 1 : 0,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        {deletingId === item.id ? (
                          <div className="dot1" style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#dc2626' }} />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                          </svg>
                        )}
                      </button>

                      <div style={{
                        fontSize: '12px', fontWeight: 600, color: '#1d2836',
                        marginBottom: '4px', paddingRight: '30px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {item.question}
                      </div>
                      <div style={{
                        fontSize: '11px', color: '#6b7280',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginBottom: '8px',
                      }}>
                        {item.reponse}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {item.modules?.slice(0, 2).map((m: string) => (
                            <span key={m} style={{
                              padding: '1px 6px', borderRadius: '4px',
                              fontSize: '10px', fontWeight: 600,
                              background: (MODULE_COLORS[m] || '#6b7280') + '15',
                              color: MODULE_COLORS[m] || '#6b7280',
                            }}>{m}</span>
                          ))}
                        </div>
                        <span style={{ fontSize: '10px', color: '#b0b8c4' }}>
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default ChatBot