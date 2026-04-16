import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/store'
import { userService, orderService, prescriptionService, supportService } from '../services/api'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  User, Mail, Phone, MapPin, Lock, Save, LogOut,
  Package, Heart, CreditCard, FileText, ChevronRight,
  ShoppingBag, Star, Clock, Shield, Bell, HelpCircle,
  Plus, Trash2, CheckCircle, X, MessageSquare, Send,
  RefreshCw,
} from 'lucide-react'

export default function Perfil() {
  const navigate = useNavigate()
  const { token, user, setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState('dados')
  const [stats, setStats] = useState({ pedidos: 0, receitas: 0 })
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    cpf: user?.cpf || '',
  })

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadStats()
  }, [token, navigate])

  const loadStats = async () => {
    try {
      const [ordersRes, prescRes] = await Promise.allSettled([
        orderService.getAll(),
        prescriptionService.getAll(),
      ])
      setStats({
        pedidos: ordersRes.status === 'fulfilled' ? (ordersRes.value?.data?.data?.pedidos?.length || ordersRes.value?.data?.data?.total || 0) : 0,
        receitas: prescRes.status === 'fulfilled' ? (prescRes.value?.data?.data?.docs?.length || prescRes.value?.data?.data?.total || 0) : 0,
      })
    } catch {}
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await userService.updateProfile(formData)
      const updatedUser = response.data?.data?.user || response.data?.user || response.data?.data
      if (updatedUser) setUser(updatedUser)
      setMessage('Perfil atualizado com sucesso!')
      setEditMode(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.mensagem || 'Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!token) return <LoadingSpinner />

  const isPharmacist = user?.tipo_usuario === 'farmacia' || user?.role === 'farmacia'

  const menuItems = [
    { id: 'dados', label: 'Meus Dados', icon: User, color: 'text-primary' },
    isPharmacist
      ? { id: 'painel', label: 'Painel do Farmacêutico', icon: Package, link: '/farmaceutico', color: 'text-blue-500' }
      : { id: 'pedidos', label: 'Meus Pedidos', icon: Package, link: '/pedidos', color: 'text-blue-500' },
    { id: 'chats', label: 'Meus Chats', icon: MessageSquare, color: 'text-indigo-500' },
    { id: 'receitas', label: 'Minhas Receitas', icon: FileText, color: 'text-amber-500' },
    { id: 'enderecos', label: 'Endereços', icon: MapPin, color: 'text-emerald-500' },
    { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard, color: 'text-violet-500' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl font-bold flex-shrink-0">
            {user?.nome?.charAt(0)?.toUpperCase() || '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{user?.nome || 'Usuário'}</h1>
            <p className="text-white/70 text-sm">{user?.email}</p>
            {user?.telefone && <p className="text-white/70 text-sm">{user.telefone}</p>}
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <div className="text-xl font-bold">{stats.pedidos}</div>
                <div className="text-[10px] text-white/60 uppercase tracking-wide">Pedidos</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <div className="text-xl font-bold">{stats.receitas}</div>
                <div className="text-[10px] text-white/60 uppercase tracking-wide">Receitas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <aside>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => item.link ? navigate(item.link) : setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${
                    activeTab === item.id && !item.link ? 'bg-primary/5' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${item.color}`} />
                  <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              )
            })}
          </div>

          <div className="mt-4 space-y-2">
            <button className="w-full flex items-center gap-3 px-5 py-3 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition text-sm text-gray-600">
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <span>Ajuda</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3 bg-white rounded-xl border border-red-100 hover:bg-red-50 transition text-sm text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da conta</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-2">
          {activeTab === 'dados' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Meus Dados</h2>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 border border-primary text-primary rounded-xl text-sm font-semibold hover:bg-primary hover:text-white transition"
                  >
                    Editar
                  </button>
                )}
              </div>

              {message && <Alert type="success" message={message} />}
              {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">CPF</label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"
                  />
                </div>

                {editMode && (
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-secondary transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false)
                        setFormData({
                          nome: user?.nome || '',
                          email: user?.email || '',
                          telefone: user?.telefone || '',
                          cpf: user?.cpf || '',
                        })
                      }}
                      className="flex-1 border border-gray-200 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'receitas' && <ReceitasTab />}

          {activeTab === 'chats' && <ChatsTab />}

          {activeTab === 'enderecos' && <EnderecosTab />}

          {activeTab === 'pagamentos' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-4">Métodos de Pagamento</h2>
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">Nenhum cartão cadastrado</p>
                <p className="text-xs text-gray-400">O pagamento é feito na finalização de cada pedido</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function EnderecosTab() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState({
    apelido: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  })

  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = async () => {
    try {
      setLoading(true)
      const res = await userService.getAddresses()
      setAddresses(res.data?.data?.enderecos || [])
    } catch {
      setAddresses([])
    } finally {
      setLoading(false)
    }
  }

  const handleCepSearch = async (cep) => {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          logradouro: data.logradouro || f.logradouro,
          bairro: data.bairro || f.bairro,
          cidade: data.localidade || f.cidade,
          estado: data.uf || f.estado,
        }))
      }
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await userService.addAddress({
        ...form,
        cep: form.cep.replace(/\D/g, ''),
      })
      setMessage('Endereço adicionado!')
      setShowForm(false)
      setForm({ apelido: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
      loadAddresses()
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar endereço')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await userService.deleteAddress(id)
      loadAddresses()
    } catch {}
  }

  const handleSetDefault = async (id) => {
    try {
      await userService.setDefaultAddress(id)
      loadAddresses()
    } catch {}
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Meus Endereços</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-secondary transition"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Adicionar'}
        </button>
      </div>

      {message && <Alert type="success" message={message} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Apelido</label>
              <input
                type="text"
                placeholder="Ex: Casa, Trabalho"
                value={form.apelido}
                onChange={(e) => setForm({ ...form, apelido: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">CEP *</label>
              <input
                type="text"
                placeholder="00000-000"
                value={form.cep}
                onChange={(e) => {
                  const val = e.target.value
                  setForm({ ...form, cep: val })
                  if (val.replace(/\D/g, '').length === 8) handleCepSearch(val)
                }}
                required
                maxLength={9}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Logradouro *</label>
            <input
              type="text"
              value={form.logradouro}
              onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Número *</label>
              <input
                type="text"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Complemento</label>
              <input
                type="text"
                value={form.complemento}
                onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bairro *</label>
              <input
                type="text"
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cidade *</label>
              <input
                type="text"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estado *</label>
              <input
                type="text"
                maxLength={2}
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-secondary transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Endereço'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Nenhum endereço cadastrado</p>
          <p className="text-xs text-gray-400">Adicione um endereço para agilizar suas compras</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr._id} className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
              <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">{addr.apelido || 'Endereço'}</span>
                  {addr.padrao && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Padrão</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">
                  {addr.logradouro}, {addr.numero}{addr.complemento ? ` - ${addr.complemento}` : ''}
                </p>
                <p className="text-xs text-gray-400">
                  {addr.bairro} · {addr.cidade}/{addr.estado} · CEP {addr.cep}
                </p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {!addr.padrao && (
                  <button
                    onClick={() => handleSetDefault(addr._id)}
                    title="Definir como padrão"
                    className="p-1.5 text-gray-400 hover:text-primary transition rounded-lg hover:bg-primary/5"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr._id)}
                  title="Remover"
                  className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ────────── Chats Tab ────────── */
function ChatsTab() {
  const { user } = useAuthStore()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadTickets()
  }, [])

  useEffect(() => {
    if (expandedId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [expandedId, tickets])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const res = await supportService.getHistory()
      const data = res.data?.data
      setTickets(Array.isArray(data) ? data : (data?.tickets || []))
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async (ticketId) => {
    const text = replyText.trim()
    if (!text || sending) return
    try {
      setSending(true)
      await supportService.sendMessage(ticketId, { texto: text })
      setReplyText('')
      loadTickets()
    } catch {} finally {
      setSending(false)
    }
  }

  const handleCloseTicket = async (ticketId) => {
    try {
      await supportService.closeTicket(ticketId)
      loadTickets()
    } catch {}
  }

  const statusColors = {
    'aberta': 'bg-yellow-100 text-yellow-700',
    'em_atendimento': 'bg-blue-100 text-blue-700',
    'respondida': 'bg-green-100 text-green-700',
    'encerrada': 'bg-gray-100 text-gray-500',
  }

  const statusLabels = {
    'aberta': 'Aguardando',
    'em_atendimento': 'Em Atendimento',
    'respondida': 'Respondida',
    'encerrada': 'Encerrada',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Meus Chats</h2>
        <button
          onClick={loadTickets}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Nenhum chat de suporte</p>
          <p className="text-xs text-gray-400">Use o chat flutuante no canto inferior para iniciar uma conversa</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const isExpanded = expandedId === ticket._id
            const msgs = ticket.mensagens || []
            const isOpen = ticket.status !== 'encerrada'
            const lastMsg = msgs[msgs.length - 1]

            return (
              <div key={ticket._id} className="border border-gray-100 rounded-xl overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedId(isExpanded ? null : ticket._id)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOpen ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                    <MessageSquare className={`w-5 h-5 ${isOpen ? 'text-indigo-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {ticket.assunto || 'Chat de suporte'}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[ticket.status] || 'bg-gray-100 text-gray-500'}`}>
                        {statusLabels[ticket.status] || ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {lastMsg
                        ? `${lastMsg.tipo_remetente === 'usuario' ? 'Você' : lastMsg.tipo_remetente === 'sistema' ? 'Sistema' : 'Farmacêutico'}: ${lastMsg.texto}`
                        : 'Sem mensagens'}
                    </p>
                    <p className="text-[10px] text-gray-300 mt-0.5">
                      {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString('pt-BR')}{' '}
                      às {new Date(ticket.updatedAt || ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded - Messages */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <div className="max-h-80 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                      {msgs.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 py-4">Nenhuma mensagem ainda</p>
                      ) : (
                        msgs.map((msg, idx) => {
                          const isUser = msg.tipo_remetente === 'usuario'
                          const isSystem = msg.tipo_remetente === 'sistema'
                          return (
                            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                                  isSystem
                                    ? 'bg-gray-200 text-gray-500 text-xs italic mx-auto text-center'
                                    : isUser
                                      ? 'bg-primary text-white rounded-br-md'
                                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                                }`}
                              >
                                {!isUser && !isSystem && (
                                  <p className="text-[10px] font-bold text-indigo-500 mb-0.5">👨‍⚕️ Farmacêutico</p>
                                )}
                                <p className="whitespace-pre-wrap">{msg.texto}</p>
                                <p className={`text-[10px] mt-1 ${isUser ? 'text-white/60' : 'text-gray-400'}`}>
                                  {new Date(msg.enviado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Reply input */}
                    {isOpen && (
                      <div className="p-3 border-t border-gray-100 bg-white">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply(ticket._id)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <button
                            onClick={() => handleSendReply(ticket._id)}
                            disabled={!replyText.trim() || sending}
                            className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-secondary transition disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleCloseTicket(ticket._id)}
                          className="w-full mt-2 text-xs text-red-500 hover:text-red-600 py-1"
                        >
                          Encerrar conversa
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReceitasTab() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPrescriptions()
  }, [])

  const loadPrescriptions = async () => {
    try {
      setLoading(true)
      const res = await prescriptionService.getAll()
      const data = res.data?.data
      setPrescriptions(Array.isArray(data) ? data : (data?.docs || data?.receitas || []))
    } catch {
      setPrescriptions([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Aprovada': 'bg-green-100 text-green-700',
      'Pendente': 'bg-yellow-100 text-yellow-700',
      'Rejeitada': 'bg-red-100 text-red-700',
      'Em análise': 'bg-blue-100 text-blue-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Minhas Receitas</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Nenhuma receita enviada</p>
          <p className="text-xs text-gray-400">Envie receitas médicas para comprar medicamentos controlados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <div key={rx._id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {rx.nome_arquivo || rx.arquivo || 'Receita médica'}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(rx.createdAt).toLocaleDateString('pt-BR')}
                  {rx.validade && ` · Válida até ${new Date(rx.validade).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${getStatusColor(rx.status)}`}>
                {rx.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
