import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/store'
import { prescriptionService, supportService } from '../services/api'
import Alert from '../components/Alert'
import {
  FileText, MessageSquare, CheckCircle, XCircle, Clock,
  Eye, Send, ChevronDown, ChevronUp, User, AlertTriangle,
  ClipboardList, RefreshCw
} from 'lucide-react'

export default function Farmaceutico() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState('receitas')

  useEffect(() => {
    if (!isAuthenticated() || !['farmacia', 'administrador'].includes(user?.role)) {
      navigate('/')
    }
  }, [user, isAuthenticated, navigate])

  const tabs = [
    { id: 'receitas', label: 'Receitas Pendentes', icon: FileText },
    { id: 'tickets', label: 'Tickets de Suporte', icon: MessageSquare },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Painel do Farmacêutico</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bem-vindo, {user?.nome?.split(' ')[0]}! Gerencie receitas e atendimentos.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {activeTab === 'receitas' && <ReceitasPanel />}
        {activeTab === 'tickets' && <TicketsPanel />}
      </div>
    </div>
  )
}

/* ────────── Receitas Panel ────────── */
function ReceitasPanel() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [observations, setObservations] = useState({})
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    loadPrescriptions()
  }, [])

  const loadPrescriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await prescriptionService.getPending()
      const data = res.data?.data
      setPrescriptions(Array.isArray(data) ? data : (data?.docs || data?.receitas || []))
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Erro ao carregar receitas')
      setPrescriptions([])
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async (id, aprovado) => {
    try {
      setActionLoading(id)
      await prescriptionService.validate(id, {
        aprovado,
        observacoes: observations[id] || (aprovado ? 'Receita aprovada pelo farmacêutico.' : 'Receita rejeitada.'),
      })
      setMessage(aprovado ? 'Receita aprovada com sucesso!' : 'Receita rejeitada.')
      setPrescriptions((prev) => prev.filter((p) => p._id !== id))
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Erro ao validar receita')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      'Pendente': { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'Em Análise': { color: 'bg-blue-100 text-blue-700', icon: Eye },
    }
    const s = map[status] || map['Pendente']
    const Icon = s.icon
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${s.color}`}>
        <Icon className="w-3 h-3" /> {status}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Receitas para Validação</h2>
            <p className="text-xs text-gray-400">{prescriptions.length} pendente(s)</p>
          </div>
        </div>
        <button
          onClick={loadPrescriptions}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {message && <div className="px-5 pt-4"><Alert type="success" message={message} /></div>}
      {error && <div className="px-5 pt-4"><Alert type="error" message={error} onClose={() => setError(null)} /></div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma receita pendente</p>
          <p className="text-xs text-gray-400 mt-1">Todas as receitas foram validadas</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {prescriptions.map((rx) => (
            <div key={rx._id} className="p-5">
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === rx._id ? null : rx._id)}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {rx.nome_arquivo || 'Receita médica'}
                    </p>
                    {getStatusBadge(rx.status)}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {rx.id_usuario?.nome || rx.id_usuario?.email || 'Paciente'}
                    </span>
                    <span className="mx-2">·</span>
                    {new Date(rx.createdAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(rx.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {expandedId === rx._id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>

              {expandedId === rx._id && (
                <div className="mt-4 ml-14 space-y-4">
                  {/* Prescription image */}
                  {rx.url_arquivo && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 max-w-md">
                      <img
                        src={rx.url_arquivo.startsWith('http') ? rx.url_arquivo : `/${rx.url_arquivo.replace(/\\/g, '/')}`}
                        alt="Receita"
                        className="w-full object-contain max-h-96 bg-gray-50"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    </div>
                  )}

                  {/* OCR Data */}
                  {rx.dados_ocr && (
                    <div className="bg-blue-50 rounded-xl p-4 text-sm">
                      <p className="font-semibold text-blue-700 mb-2">Dados extraídos (OCR):</p>
                      <div className="grid grid-cols-2 gap-2 text-blue-600">
                        {rx.dados_ocr.medico && <p><span className="font-medium">Médico:</span> {rx.dados_ocr.medico}</p>}
                        {rx.dados_ocr.crm && <p><span className="font-medium">CRM:</span> {rx.dados_ocr.crm}</p>}
                        {rx.dados_ocr.principio_ativo && (
                          <p><span className="font-medium">Princípio ativo:</span> {rx.dados_ocr.principio_ativo}</p>
                        )}
                        {rx.dados_ocr.data_emissao && (
                          <p><span className="font-medium">Emissão:</span> {new Date(rx.dados_ocr.data_emissao).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CRM Validation */}
                  {rx.validacao_crm && (
                    <div className={`rounded-xl p-3 text-sm ${rx.validacao_crm.valido ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <span className="font-semibold">CRM: </span>
                      {rx.validacao_crm.valido ? '✓ Verificado' : '✗ Não verificado'}
                      {rx.validacao_crm.detalhes && ` — ${rx.validacao_crm.detalhes}`}
                    </div>
                  )}

                  {/* Observations + Actions */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Observações (opcional)</label>
                    <textarea
                      rows={2}
                      value={observations[rx._id] || ''}
                      onChange={(e) => setObservations({ ...observations, [rx._id]: e.target.value })}
                      placeholder="Adicione observações sobre a receita..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleValidate(rx._id, true)}
                      disabled={actionLoading === rx._id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {actionLoading === rx._id ? 'Processando...' : 'Aprovar'}
                    </button>
                    <button
                      onClick={() => handleValidate(rx._id, false)}
                      disabled={actionLoading === rx._id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      {actionLoading === rx._id ? 'Processando...' : 'Rejeitar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ────────── Tickets Panel ────────── */
function TicketsPanel() {
  const { user } = useAuthStore()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [replyText, setReplyText] = useState({})
  const [actionLoading, setActionLoading] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await supportService.getAllTickets()
      const data = res.data?.data
      setTickets(Array.isArray(data) ? data : (data?.tickets || data?.mensagens || []))
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Erro ao carregar tickets')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (id) => {
    try {
      setActionLoading(id)
      await supportService.assignTicket(id)
      setMessage('Ticket assumido com sucesso!')
      loadTickets()
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Erro ao assumir ticket')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReply = async (id) => {
    const text = replyText[id]?.trim()
    if (!text) return
    try {
      setActionLoading(id)
      await supportService.sendMessage(id, { texto: text })
      setReplyText({ ...replyText, [id]: '' })
      setMessage('Mensagem enviada!')
      loadTickets()
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Erro ao enviar mensagem')
    } finally {
      setActionLoading(null)
    }
  }

  const handleClose = async (id) => {
    try {
      setActionLoading(id)
      await supportService.closeTicket(id)
      setMessage('Ticket encerrado!')
      loadTickets()
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Erro ao encerrar ticket')
    } finally {
      setActionLoading(null)
    }
  }

  const statusColors = {
    'aberta': 'bg-yellow-100 text-yellow-700',
    'em_atendimento': 'bg-blue-100 text-blue-700',
    'respondida': 'bg-green-100 text-green-700',
    'encerrada': 'bg-gray-100 text-gray-500',
  }

  const statusLabels = {
    'aberta': 'Aberta',
    'em_atendimento': 'Em Atendimento',
    'respondida': 'Respondida',
    'encerrada': 'Encerrada',
  }

  const prioridadeColors = {
    'baixa': 'text-gray-400',
    'normal': 'text-blue-400',
    'alta': 'text-orange-500',
    'urgente': 'text-red-500',
  }

  const openTickets = tickets.filter((t) => t.status !== 'encerrada')
  const closedTickets = tickets.filter((t) => t.status === 'encerrada')

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Tickets de Suporte</h2>
              <p className="text-xs text-gray-400">{openTickets.length} aberto(s) · {closedTickets.length} encerrado(s)</p>
            </div>
          </div>
          <button
            onClick={loadTickets}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {message && <div className="px-5 pt-4"><Alert type="success" message={message} /></div>}
        {error && <div className="px-5 pt-4"><Alert type="error" message={error} onClose={() => setError(null)} /></div>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : openTickets.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum ticket aberto</p>
            <p className="text-xs text-gray-400 mt-1">Todos os atendimentos estão em dia</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {openTickets.map((ticket) => (
              <div key={ticket._id} className="p-5">
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === ticket._id ? null : ticket._id)}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {ticket.assunto || ticket.categoria || 'Ticket de suporte'}
                      </p>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusColors[ticket.status] || 'bg-gray-100 text-gray-500'}`}>
                        {statusLabels[ticket.status] || ticket.status}
                      </span>
                      {ticket.prioridade && ticket.prioridade !== 'normal' && (
                        <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${prioridadeColors[ticket.prioridade]}`}>
                          <AlertTriangle className="w-3 h-3" />
                          {ticket.prioridade.charAt(0).toUpperCase() + ticket.prioridade.slice(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ticket.id_usuario?.nome || ticket.id_usuario?.email || 'Usuário'}
                      </span>
                      <span className="mx-2">·</span>
                      {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      {ticket.id_atendente && (
                        <>
                          <span className="mx-2">·</span>
                          Atendente: {ticket.id_atendente?.nome || 'Você'}
                        </>
                      )}
                    </p>
                  </div>
                  {expandedId === ticket._id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {expandedId === ticket._id && (
                  <div className="mt-4 ml-14 space-y-4">
                    {/* Messages */}
                    <div className="bg-gray-50 rounded-xl p-4 max-h-80 overflow-y-auto space-y-3">
                      {(ticket.mensagens || []).length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">Nenhuma mensagem ainda</p>
                      ) : (
                        ticket.mensagens.map((msg, i) => {
                          const isStaff = ['farmaceutico', 'admin', 'sistema'].includes(msg.tipo_remetente)
                          return (
                            <div key={i} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                isStaff
                                  ? 'bg-primary text-white rounded-br-md'
                                  : 'bg-white border border-gray-200 text-gray-700 rounded-bl-md'
                              }`}>
                                <p className={`text-[10px] font-bold mb-1 ${isStaff ? 'text-white/70' : 'text-gray-400'}`}>
                                  {msg.tipo_remetente === 'usuario' ? 'Cliente' : msg.tipo_remetente === 'farmaceutico' ? 'Farmacêutico' : 'Admin'}
                                </p>
                                <p>{msg.texto}</p>
                                <p className={`text-[10px] mt-1 ${isStaff ? 'text-white/50' : 'text-gray-300'}`}>
                                  {new Date(msg.enviado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {ticket.status === 'aberta' && !ticket.id_atendente && (
                        <button
                          onClick={() => handleAssign(ticket._id)}
                          disabled={actionLoading === ticket._id}
                          className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50"
                        >
                          {actionLoading === ticket._id ? 'Assumindo...' : 'Assumir Ticket'}
                        </button>
                      )}
                      <button
                        onClick={() => handleClose(ticket._id)}
                        disabled={actionLoading === ticket._id}
                        className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                      >
                        Encerrar
                      </button>
                    </div>

                    {/* Reply */}
                    {ticket.status !== 'encerrada' && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText[ticket._id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [ticket._id]: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleReply(ticket._id)}
                          placeholder="Digite sua resposta..."
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <button
                          onClick={() => handleReply(ticket._id)}
                          disabled={actionLoading === ticket._id || !replyText[ticket._id]?.trim()}
                          className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-secondary transition disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
