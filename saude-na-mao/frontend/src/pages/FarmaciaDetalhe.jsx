import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, Clock, MapPin, ArrowLeft, Search, ShoppingCart, Filter, Truck, User, MessageSquare, ChevronDown } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { useCartStore, useUiStore } from '../stores/store'
import api from '../services/api'

export default function FarmaciaDetalhe() {
  const { id } = useParams()
  const [pharmacy, setPharmacy] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('')
  const [sortBy, setSortBy] = useState('nome')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [pharmRes, prodsRes] = await Promise.all([
        api.get(`/farmacias/${id}`),
        api.get(`/farmacias/${id}/products`, { params: { limit: 100 } }),
      ])
      setPharmacy(pharmRes.data?.data?.farmacia || pharmRes.data?.data)
      const prodsPayload = prodsRes.data?.data
      setProducts(Array.isArray(prodsPayload) ? prodsPayload : prodsPayload?.docs ?? [])
    } catch (err) {
      console.error('Erro ao carregar farmácia:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!pharmacy) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 text-lg">Farmácia não encontrada</p>
        <Link to="/farmacias" className="text-primary font-semibold mt-4 inline-block">
          Voltar para farmácias
        </Link>
      </div>
    )
  }

  const categorias = [...new Set(products.map((p) => p.categoria).filter(Boolean))]

  const filtered = products
    .filter((p) => {
      const matchSearch = !search ||
        p.nome?.toLowerCase().includes(search.toLowerCase()) ||
        p.principio_ativo?.toLowerCase().includes(search.toLowerCase())
      const matchCategoria = !categoria || p.categoria === categoria
      return matchSearch && matchCategoria
    })
    .sort((a, b) => {
      if (sortBy === 'preco-asc') return (a.preco_final || a.preco) - (b.preco_final || b.preco)
      if (sortBy === 'preco-desc') return (b.preco_final || b.preco) - (a.preco_final || a.preco)
      return a.nome?.localeCompare(b.nome)
    })

  const initial = pharmacy.nome?.charAt(0) || 'F'
  const colors = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-violet-500 to-violet-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
  ]
  const colorIndex = pharmacy.nome?.length % colors.length || 0

  return (
    <div>
      <div className={`bg-gradient-to-br ${colors[colorIndex]} text-white`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link to="/farmacias" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar para farmácias
          </Link>

          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-4xl font-bold">{initial}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{pharmacy.nome}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  <span className="font-semibold text-white">{pharmacy.avaliacao?.toFixed(1)}</span>
                  <span>({pharmacy.total_avaliacoes} avaliações)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{pharmacy.horario_funcionamento}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{pharmacy.logradouro}, {pharmacy.numero} - {pharmacy.bairro}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <span className="bg-white/15 backdrop-blur-sm text-sm px-3 py-1 rounded-full">
                  <Truck className="w-3.5 h-3.5 inline mr-1" />
                  Entrega disponível
                </span>
                <span className="bg-white/15 backdrop-blur-sm text-sm px-3 py-1 rounded-full">
                  {products.length} produtos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produto nesta farmácia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          >
            <option value="">Todas categorias</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          >
            <option value="nome">Nome (A-Z)</option>
            <option value="preco-asc">Menor preço</option>
            <option value="preco-desc">Maior preço</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <div className="text-5xl mb-4">💊</div>
            <p className="text-gray-500 text-lg">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((product) => (
              <PharmacyProductCard
                key={product._id}
                product={product}
                pharmacyId={id}
                pharmacyName={pharmacy.nome}
              />
            ))}
          </div>
        )}

        <ReviewsSection pharmacyId={id} pharmacyRating={pharmacy.avaliacao} totalReviews={pharmacy.total_avaliacoes} />
      </div>
    </div>
  )
}

function PharmacyProductCard({ product, pharmacyId, pharmacyName }) {
  const { addItem, replaceCartWithItem } = useCartStore()
  const { addNotification } = useUiStore()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [showConflict, setShowConflict] = useState(false)
  const [conflictPharmacy, setConflictPharmacy] = useState('')

  const preco = product.preco_final || product.preco
  const temPromocao = product.preco_promocional && product.preco_promocional < product.preco

  const productData = {
    id: product._id,
    nome: product.nome,
    preco: preco,
    imagem: product.imagens?.[0],
    controlado: product.controlado,
    id_farmacia: pharmacyId,
    nome_farmacia: pharmacyName,
    quantity,
  }

  const handleAdd = () => {
    const result = addItem(productData)
    if (result?.pharmacyConflict) {
      setConflictPharmacy(result.currentPharmacyName)
      setShowConflict(true)
      return
    }
    setAdded(true)
    addNotification?.({ type: 'success', message: `${product.nome} adicionado ao carrinho` })
    setTimeout(() => setAdded(false), 2000)
  }

  const handleReplaceCart = () => {
    replaceCartWithItem(productData)
    setShowConflict(false)
    setAdded(true)
    addNotification?.({ type: 'success', message: `Carrinho atualizado com item de ${pharmacyName}` })
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-36 flex items-center justify-center relative">
        <div className="text-5xl">💊</div>
        {product.controlado && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            Controlado
          </span>
        )}
        {!product.controlado && product.receita_obrigatoria && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            Receita
          </span>
        )}
        {temPromocao && (
          <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            Promoção
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 min-h-[40px]">
          {product.nome}
        </h3>
        <p className="text-xs text-gray-400 mb-3">{product.fabricante} · {product.dosagem}</p>

        <div className="mb-3">
          {temPromocao && (
            <span className="text-xs text-gray-400 line-through mr-2">
              R$ {product.preco?.toFixed(2)}
            </span>
          )}
          <span className="text-xl font-bold text-primary">
            R$ {preco?.toFixed(2)}
          </span>
        </div>

        {product.estoque > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 transition text-sm"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.estoque, quantity + 1))}
                className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 transition text-sm"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition ${
                added
                  ? 'bg-emerald-500 text-white'
                  : 'bg-primary text-white hover:bg-secondary'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {added ? 'Adicionado!' : 'Adicionar'}
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-sm text-red-500 font-medium bg-red-50 rounded-lg">
            Indisponível
          </div>
        )}
      </div>

      {showConflict && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowConflict(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Farmácia diferente</h3>
            <p className="text-sm text-gray-600 mb-4">
              Seu carrinho contém itens de <strong>{conflictPharmacy}</strong>. Deseja limpar o carrinho e adicionar itens de <strong>{pharmacyName}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConflict(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleReplaceCart}
                className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-secondary transition"
              >
                Limpar e adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewsSection({ pharmacyId, pharmacyRating, totalReviews }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadReviews()
  }, [pharmacyId, page])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/avaliacoes/pharmacy/${pharmacyId}`, {
        params: { page, limit: 6 },
      })
      const data = res.data?.data
      setReviews(data?.reviews || [])
      setTotalPages(data?.totalPages || 1)
      setTotal(data?.total || 0)
    } catch (err) {
      console.error('Erro ao carregar avaliações:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (nota) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < nota ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
      />
    ))
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''} atrás`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ${Math.floor(diffDays / 30) === 1 ? 'mês' : 'meses'} atrás`
    return date.toLocaleDateString('pt-BR')
  }

  const getInitial = (name) => {
    return name?.charAt(0)?.toUpperCase() || '?'
  }

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-emerald-100 text-emerald-600',
      'bg-violet-100 text-violet-600',
      'bg-orange-100 text-orange-600',
      'bg-pink-100 text-pink-600',
      'bg-cyan-100 text-cyan-600',
      'bg-rose-100 text-rose-600',
      'bg-amber-100 text-amber-600',
    ]
    const index = (name?.length || 0) % colors.length
    return colors[index]
  }

  return (
    <div className="mt-12 border-t border-gray-100 pt-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-900">Avaliações</h2>
          <span className="text-sm text-gray-400">({total})</span>
        </div>
        {pharmacyRating > 0 && (
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-lg font-bold text-gray-900">{pharmacyRating?.toFixed(1)}</span>
            <span className="text-sm text-gray-400">/ 5</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma avaliação ainda</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarColor(review.nome_usuario)}`}>
                    <span className="text-sm font-bold">{getInitial(review.nome_usuario)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {review.nome_usuario}
                      </h4>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {renderStars(review.nota)}
                    </div>
                    {review.comentario && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        "{review.comentario}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500">
                {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
