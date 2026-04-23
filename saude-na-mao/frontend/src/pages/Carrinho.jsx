import { useState, useEffect } from 'react'
import { useCartStore } from '../stores/store'
import { useNavigate, Link } from 'react-router-dom'
import { Trash2, ArrowRight, Tag, Truck, Store, X, CheckCircle, AlertTriangle } from 'lucide-react'
import api, { interactionService } from '../services/api'

export default function Carrinho() {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, getTotal, clearCart, addItem } = useCartStore()
  const [couponCode, setCouponCode] = useState('')
  const [couponData, setCouponData] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [deliveryType, setDeliveryType] = useState('moto')
  const [interactions, setInteractions] = useState([])

  // Reorder: load items from localStorage if present
  useEffect(() => {
    const reorderRaw = localStorage.getItem('reorder_items')
    if (reorderRaw) {
      try {
        const reorderItems = JSON.parse(reorderRaw)
        if (Array.isArray(reorderItems) && reorderItems.length > 0) {
          clearCart()
          reorderItems.forEach((item) => addItem(item))
        }
      } catch { /* ignore */ }
      localStorage.removeItem('reorder_items')
    }
  }, [])

  // Check drug interactions when items change
  useEffect(() => {
    if (items.length < 2) {
      setInteractions([])
      return
    }
    const productIds = items.map((i) => i.id).filter(Boolean)
    if (productIds.length < 2) return
    interactionService.check({ product_ids: productIds })
      .then((res) => {
        setInteractions(res.data?.data?.interacoes || [])
      })
      .catch(() => setInteractions([]))
  }, [items])

  const pharmacyName = items[0]?.nome_farmacia || 'Farmácia'

  const subtotal = getTotal()

  const calculateTaxa = () => {
    const fees = { moto: 8.00, retirada: 0 }
    let taxa = fees[deliveryType] || 8.00
    if (subtotal >= 150 && deliveryType === 'moto') taxa = 0
    return taxa
  }

  const taxaEntrega = calculateTaxa()

  const desconto = couponData?.desconto || 0
  const freteGratis = couponData?.frete_gratis || false
  if (freteGratis) taxaEntrega = 0

  const total = Math.max(0, subtotal - desconto + taxaEntrega)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    try {
      setCouponLoading(true)
      setCouponError('')
      const res = await api.post('/cupons/validar', {
        codigo: couponCode,
        subtotal,
      })
      setCouponData(res.data?.data)
    } catch (err) {
      setCouponError(err.message || err.data?.message || 'Cupom inválido')
      setCouponData(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setCouponData(null)
    setCouponCode('')
    setCouponError('')
  }

  const hasControlled = items.some((i) => i.controlado)

  const handleFinalize = () => {
    // Se tem medicamentos controlados, redirecionar para página de receita
    if (hasControlled) {
      // Save cart state for checkout
      localStorage.setItem('checkout_data', JSON.stringify({
        subtotal,
        taxaEntrega,
        desconto,
        total,
        deliveryType,
        couponData,
        pharmacyName,
        pharmacyId: items[0]?.id_farmacia,
      }))
      
      navigate('/receita')
      return
    }

    // Save cart state for checkout
    localStorage.setItem('checkout_data', JSON.stringify({
      subtotal,
      taxaEntrega,
      desconto,
      total,
      deliveryType,
      couponData,
      pharmacyName,
      pharmacyId: items[0]?.id_farmacia,
    }))

    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold mb-2">Carrinho Vazio</h1>
          <p className="text-gray-600 mb-6">
            Você ainda não adicionou nenhum produto ao carrinho
          </p>
          <Link
            to="/farmacias"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary transition"
          >
            Ver Farmácias
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Meu Carrinho</h1>
      <div className="flex items-center gap-2 mb-8 text-gray-500">
        <Store className="w-4 h-4" />
        <span className="text-sm">{pharmacyName}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`p-5 flex gap-4 hover:bg-gray-50 transition ${idx > 0 ? 'border-t border-gray-100' : ''}`}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💊</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.nome}</h3>
                  <div className="text-primary font-bold">
                    R$ {item.preco?.toFixed(2)}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-300 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-gray-500 hover:bg-gray-50 transition text-sm"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-gray-500 hover:bg-gray-50 transition text-sm"
                    >
                      +
                    </button>
                  </div>

                  <div className="font-bold text-sm text-gray-900">
                    R$ {(item.preco * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link
              to="/farmacias"
              className="flex-1 border border-primary text-primary px-5 py-3 rounded-xl font-semibold hover:bg-primary/5 transition text-center text-sm"
            >
              Continuar Comprando
            </Link>
            <button
              onClick={clearCart}
              className="px-5 py-3 text-red-500 border border-red-200 rounded-xl font-semibold hover:bg-red-50 transition text-sm"
            >
              Limpar
            </button>
          </div>

          {/* Drug Interaction Alert */}
          {interactions.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-800 text-sm mb-2">
                    Alerta de Interação Medicamentosa
                  </h3>
                  <div className="space-y-2">
                    {interactions.map((inter, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            inter.severidade === 'grave' ? 'bg-red-500' :
                            inter.severidade === 'moderada' ? 'bg-orange-500' : 'bg-yellow-500'
                          }`} />
                          <span className="font-semibold text-red-800">
                            {inter.medicamentos?.join(' + ')}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            inter.severidade === 'grave' ? 'bg-red-200 text-red-800' :
                            inter.severidade === 'moderada' ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {inter.severidade?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-red-700 ml-4 mt-0.5">{inter.descricao}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-red-600 mt-3 font-medium">
                    Consulte seu médico ou farmacêutico antes de prosseguir.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" /> Entrega
            </h3>
            <div className="space-y-2">
              {[
                { value: 'moto', label: 'Motoboy', desc: 'Até 60 min', fee: subtotal >= 150 ? 0 : 8 },
                { value: 'retirada', label: 'Retirada', desc: 'Retire na farmácia', fee: 0 },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    deliveryType === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={opt.value}
                    checked={deliveryType === opt.value}
                    onChange={(e) => setDeliveryType(e.target.value)}
                    className="accent-primary"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </div>
                  <span className={`text-sm font-bold ${opt.fee === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {opt.fee === 0 ? 'Grátis' : `R$ ${opt.fee.toFixed(2)}`}
                  </span>
                </label>
              ))}
              {subtotal >= 150 && deliveryType === 'moto' && (
                <p className="text-xs text-emerald-600 mt-1 ml-1">Frete grátis para pedidos acima de R$ 150</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-orange-500" /> Cupom de Desconto
            </h3>
            {couponData ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-emerald-700 text-sm">{couponData.cupom?.codigo}</div>
                  <div className="text-xs text-emerald-600">
                    {couponData.frete_gratis ? 'Frete grátis' : `-R$ ${couponData.desconto?.toFixed(2)}`}
                  </div>
                </div>
                <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite o cupom"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-secondary transition disabled:opacity-50"
                  >
                    {couponLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-500 mt-2">{couponError}</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-bold mb-4">Resumo do Pedido</h2>

            <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
                <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frete</span>
                <span className={`font-medium ${taxaEntrega === 0 ? 'text-emerald-600' : ''}`}>
                  {taxaEntrega === 0 ? 'Grátis' : `R$ ${taxaEntrega.toFixed(2)}`}
                </span>
              </div>

              {desconto > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Desconto</span>
                  <span className="font-medium">-R$ {desconto.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-5">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-primary">
                R$ {total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleFinalize}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-secondary transition flex items-center justify-center gap-2"
            >
              {hasControlled ? 'Enviar Receita' : 'Finalizar Compra'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {hasControlled && (
              <p className="text-xs text-amber-600 text-center mt-3 font-medium">
                ⚠️ Seu carrinho contém medicamento controlado. Será necessário enviar a receita médica.
              </p>
            )}
            {!hasControlled && (
              <p className="text-xs text-gray-400 text-center mt-3">
                Escolha o método de pagamento na próxima etapa
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
