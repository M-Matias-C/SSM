import { ShoppingCart, Heart } from 'lucide-react'
import { useCartStore, useFavoritesStore } from '../stores/store'
import { useState } from 'react'

export default function ProductCard({ product }) {
  const { addItem, replaceCartWithItem } = useCartStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [showConflict, setShowConflict] = useState(false)
  const [conflictPharmacy, setConflictPharmacy] = useState('')

  const favorite = isFavorite(product.id || product._id)

  const productData = { ...product, quantity }

  const handleAddToCart = () => {
    const result = addItem(productData)
    if (result?.pharmacyConflict) {
      setConflictPharmacy(result.currentPharmacyName)
      setShowConflict(true)
      return
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleReplaceCart = () => {
    replaceCartWithItem(productData)
    setShowConflict(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const isControlled = product.controlado || product.necessitaReceita

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition transform hover:-translate-y-1">
      <div className="bg-gradient-to-br from-blue-50 to-green-50 h-48 flex items-center justify-center relative">
        <img
          src={product.imagem || 'https://via.placeholder.com/200'}
          alt={product.nome}
          className="h-32 w-32 object-contain"
        />
        <button
          onClick={() => toggleFavorite({ id: product.id || product._id, nome: product.nome, preco: product.preco, imagem_url: product.imagem, id_farmacia: product.id_farmacia })}
          className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition"
          aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart className={`w-5 h-5 transition ${favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
        {isControlled && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Controlado
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2">
          {product.nome}
        </h3>

        {product.descricao && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-1">
            {product.descricao}
          </p>
        )}

        <div className="mb-4">
          <div className="text-2xl font-bold text-primary">
            R$ {product.preco?.toFixed(2) || '0.00'}
          </div>
          {product.estoque > 0 ? (
            <p className="text-xs text-green-600">✓ Disponível ({product.estoque})</p>
          ) : (
            <p className="text-xs text-red-600">Fora de estoque</p>
          )}
        </div>

        <div className="space-y-2">
          {product.estoque > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-2 py-1 border rounded hover:bg-gray-100"
              >
                -
              </button>
              <span className="flex-1 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.estoque, quantity + 1))}
                className="px-2 py-1 border rounded hover:bg-gray-100"
              >
                +
              </button>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={product.estoque === 0}
            className={`w-full py-2 rounded font-semibold flex items-center justify-center gap-2 transition ${
              added
                ? 'bg-green-500 text-white'
                : product.estoque === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-secondary'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {added ? 'Adicionado!' : 'Adicionar ao Carrinho'}
          </button>
        </div>
      </div>

      {showConflict && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowConflict(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Farmácia diferente</h3>
            <p className="text-sm text-gray-600 mb-4">
              Seu carrinho contém itens de <strong>{conflictPharmacy}</strong>. Deseja limpar o carrinho e adicionar itens de outra farmácia?
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
