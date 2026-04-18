import { useEffect } from 'react'
import { useUiStore, useAuthStore } from '../stores/store'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { io } from 'socket.io-client'

const ICON_MAP = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLOR_MAP = {
  success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
}

export default function NotificationToast() {
  const { notifications, removeNotification, addNotification } = useUiStore()
  const { token, user } = useAuthStore()

  useEffect(() => {
    if (!token || !user?.id) return

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      socket.emit('join:user', user.id)
    })

    socket.on('order:status:updated', (data) => {
      const statusLabels = {
        confirmado: 'confirmado',
        em_processamento: 'em processamento',
        a_caminho: 'a caminho',
        entregue: 'entregue',
        cancelado: 'cancelado',
      }
      addNotification({
        type: data.status === 'cancelado' ? 'error' : 'success',
        title: 'Pedido Atualizado',
        message: `Seu pedido está ${statusLabels[data.status] || data.status}`,
      })
    })

    socket.on('prescription:validated', (data) => {
      addNotification({
        type: data.status === 'aprovada' ? 'success' : 'warning',
        title: 'Receita Atualizada',
        message: data.status === 'aprovada'
          ? 'Sua receita foi aprovada!'
          : 'Sua receita precisa de atenção',
      })
    })

    socket.on('delivery:new', () => {
      addNotification({
        type: 'info',
        title: 'Nova Entrega',
        message: 'Uma nova entrega está disponível!',
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [token, user?.id])

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => {
        const Icon = ICON_MAP[n.type] || Info
        const colors = COLOR_MAP[n.type] || COLOR_MAP.info
        return (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-in ${colors}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {n.title && <p className="font-semibold text-sm">{n.title}</p>}
              <p className="text-sm opacity-90">{n.message}</p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="flex-shrink-0 hover:opacity-70 transition"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
