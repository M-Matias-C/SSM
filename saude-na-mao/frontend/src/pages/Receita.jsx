import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore, useCartStore } from '../stores/store'
import { prescriptionService } from '../services/api'
import {
  Camera,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  X,
  Shield,
  Clock,
  Truck,
  Eye,
  ShoppingCart,
} from 'lucide-react'

export default function Receita() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const { items } = useCartStore()
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error, setError] = useState('')
  const [rxStatus, setRxStatus] = useState(null) // null | 'Pendente' | 'Em Análise' | 'Aprovada' | 'Rejeitada'

  const controlledItems = items.filter((i) => i.controlado)

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: '/receita' } })
      return
    }
  }, [token, navigate])

  // Poll prescription status after upload
  useEffect(() => {
    if (!uploaded || rxStatus === 'Aprovada' || rxStatus === 'Rejeitada') return

    const poll = async () => {
      try {
        const res = await prescriptionService.getAll()
        const receitas = res.data?.data?.receitas || []
        if (receitas.length > 0) {
          setRxStatus(receitas[0].status)
        }
      } catch {
        // silently retry
      }
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [uploaded, rxStatus])

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(selected.type)) {
      setError('Formato não permitido. Use JPG, PNG ou PDF.')
      return
    }
    if (selected.size > 15 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 15MB.')
      return
    }

    setFile(selected)
    setError('')

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target.result)
      reader.readAsDataURL(selected)
    } else {
      setPreview(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    try {
      setUploading(true)
      setError('')
      await prescriptionService.upload(file)
      setUploaded(true)
    } catch (err) {
      setError(err.message || 'Erro ao enviar receita. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/carrinho"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao carrinho
      </Link>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Receita Médica</h1>
        <p className="text-gray-500">
          Medicamentos controlados exigem receita. Envie a foto da sua receita para validação.
        </p>
      </div>

      {/* Controlled Items */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <h3 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Medicamentos controlados no seu pedido
        </h3>
        <div className="space-y-2">
          {controlledItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <span className="text-lg">💊</span>
              <span className="font-medium text-amber-900">{item.nome}</span>
              <span className="text-amber-600">x{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Como funciona</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-sm mb-1">1. Envie a foto</h4>
            <p className="text-xs text-gray-500">Tire uma foto da receita com boa iluminação</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-semibold text-sm mb-1">2. Farmácia valida</h4>
            <p className="text-xs text-gray-500">O farmacêutico verifica a receita e aprova</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
              <Truck className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="font-semibold text-sm mb-1">3. Entregador busca</h4>
            <p className="text-xs text-gray-500">O entregador recolhe a receita física na entrega</p>
          </div>
        </div>
      </div>

      {/* Upload area */}
      {uploaded ? (
        <div className={`border rounded-xl p-8 text-center mb-6 ${
          rxStatus === 'Aprovada'
            ? 'bg-emerald-50 border-emerald-200'
            : rxStatus === 'Rejeitada'
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          {rxStatus === 'Aprovada' ? (
            <>
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-emerald-800 mb-2">Receita Aprovada!</h3>
              <p className="text-sm text-emerald-600 mb-4">
                Sua receita foi aprovada pelo farmacêutico. Você já pode prosseguir para o pagamento.
              </p>
              <button
                onClick={() => navigate('/checkout')}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition inline-flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Ir para o Checkout
              </button>
            </>
          ) : rxStatus === 'Rejeitada' ? (
            <>
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-800 mb-2">Receita Rejeitada</h3>
              <p className="text-sm text-red-600 mb-4">
                Sua receita não foi aprovada. Por favor, envie uma nova receita válida.
              </p>
              <button
                onClick={() => { setUploaded(false); setRxStatus(null); removeFile() }}
                className="px-6 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition"
              >
                Enviar Nova Receita
              </button>
            </>
          ) : (
            <>
              <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-bold text-amber-800 mb-2">Aguardando Avaliação</h3>
              <p className="text-sm text-amber-600 mb-2">
                Sua receita foi enviada e está sendo avaliada pelo farmacêutico.
              </p>
              <p className="text-xs text-amber-500">
                Aguarde a aprovação para continuar com o pagamento. Esta página atualiza automaticamente.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" /> Enviar Receita
          </h3>

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
            >
              <Camera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700 mb-1">
                Clique para selecionar ou tirar foto
              </p>
              <p className="text-xs text-gray-400">
                JPG, PNG ou PDF · Máximo 15MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview da receita"
                    className="w-full max-h-80 object-contain rounded-xl border border-gray-200"
                  />
                  <button
                    onClick={removeFile}
                    className="absolute top-2 right-2 bg-white shadow-md rounded-full p-1.5 hover:bg-red-50 transition"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button onClick={removeFile} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-secondary transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Enviar Receita
                  </>
                )}
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Important notes */}
      <div className="bg-gray-50 rounded-xl p-5 mb-6">
        <h3 className="font-bold text-sm text-gray-800 mb-3">⚠️ Informações Importantes</h3>
        <ul className="space-y-2 text-xs text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>A receita será validada pelo farmacêutico responsável da farmácia.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>O entregador irá até seu endereço <strong>buscar a receita física</strong> no ato da entrega.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Após aprovação, o farmacêutico orienta o entregador sobre os documentos que precisará trazer de volta à farmácia.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Receitas controladas têm validade máxima de 6 meses.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Tenha um documento com foto em mãos para o entregador verificar.</span>
          </li>
        </ul>
      </div>

      {/* Continue button */}
      <button
        onClick={() => navigate('/checkout')}
        disabled={rxStatus !== 'Aprovada'}
        className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
          rxStatus === 'Aprovada'
            ? 'bg-primary text-white hover:bg-secondary'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Continuar para Pagamento
        <ArrowRight className="w-4 h-4" />
      </button>

      {rxStatus !== 'Aprovada' && (
        <p className="text-xs text-gray-400 text-center mt-3">
          {uploaded
            ? rxStatus === 'Rejeitada'
              ? 'Envie uma nova receita para prosseguir'
              : 'Aguarde a aprovação da receita pelo farmacêutico'
            : 'Envie a receita para prosseguir com o pedido'
          }
        </p>
      )}
    </div>
  )
}
