import axios from 'axios'
import { useAuthStore } from '../stores/store'
import Logger from '../utils/logger'
import { ERROR_MESSAGES, HTTP_STATUS } from '../constants'

const logger = new Logger('ApiClient')

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    logger.debug(`${config.method.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    logger.error('Request interceptor error', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    const { config } = response
    const duration = response.duration || 0
    logger.logApiCall(
      config.method.toUpperCase(),
      config.url,
      response.status,
      duration
    )
    return response
  },
  async (error) => {
    const { response, message, config } = error

    if (!response) {
      logger.error('Network error', {
        url: error.config?.url,
        message,
      })
      return Promise.reject({
        status: 'NETWORK_ERROR',
        message: ERROR_MESSAGES.NETWORK,
      })
    }

    const status = response.status
    const authStore = useAuthStore.getState()

    if (status === HTTP_STATUS.UNAUTHORIZED) {
      logger.warn('Unauthorized - Token invalid or expired')
      authStore.logout()
      window.location.href = '/login'
      return Promise.reject({
        status,
        message: 'Sessão expirada. Faça login novamente.',
      })
    }

    const retryableStatuses = [408, 429, 500, 502, 503, 504]
    const retryCount = (config.__retryCount || 0)
    const maxRetries = 3

    if (retryableStatuses.includes(status) && retryCount < maxRetries) {
      config.__retryCount = retryCount + 1
      
      const delayMs = Math.pow(2, retryCount) * 1000
      logger.debug(`Retrying request after ${delayMs}ms`, { url: config.url, attempt: retryCount + 1 })
      
      await new Promise(resolve => setTimeout(resolve, delayMs))
      return api(config)
    }

    logger.error(`API Error ${status || 'No Status'}`, {
      url: error.config?.url,
      status,
      message: response?.data?.message || message,
      data: response?.data,
    })

    const formattedError = {
      status,
      message: response?.data?.message || ERROR_MESSAGES.GENERIC,
      data: response?.data,
    }

    return Promise.reject(formattedError)
  }
)

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (email, senha) => api.post('/auth/login', { email, senha }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/users/me'),
}

export const productService = {
  getAll: (params) => api.get('/produtos', { params }),
  getById: (id) => api.get(`/produtos/${id}`),
  search: (query) => api.get('/produtos', { params: { q: query } }),
  getCategories: () => api.get('/produtos/categorias'),
  getFeatured: () => api.get('/produtos/destaque'),
}

export const cartService = {
  get: () => api.get('/carrinho'),
  add: (productId, quantity) => api.post('/carrinho', { productId, quantity }),
  remove: (productId) => api.delete(`/carrinho/${productId}`),
  update: (productId, quantity) => api.put(`/carrinho/${productId}`, { quantity }),
  clear: () => api.delete('/carrinho'),
}

export const orderService = {
  getAll: () => api.get('/pedidos'),
  getById: (id) => api.get(`/pedidos/${id}`),
  create: (data) => api.post('/pedidos', data),
  updateStatus: (id, status) => api.put(`/pedidos/${id}/status`, { status }),
  track: (id) => api.get(`/pedidos/${id}/rastreamento`),
}

export const paymentService = {
  process: (data) => api.post('/pagamentos', data),
  getStatus: (id) => api.get(`/pagamentos/${id}`),
}

export const prescriptionService = {
  upload: (file) => {
    const formData = new FormData()
    formData.append('receita', file)
    return api.post('/receitas/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getAll: () => api.get('/receitas'),
  getById: (id) => api.get(`/receitas/${id}`),
  getPending: () => api.get('/receitas/admin/pending'),
  validate: (id, data) => api.patch(`/receitas/admin/${id}/validate`, data),
}

export const pharmacyService = {
  getAll: (params) => api.get('/farmacias', { params }),
  getById: (id) => api.get(`/farmacias/${id}`),
  getProducts: (id, params) => api.get(`/farmacias/${id}/products`, { params }),
  search: (lat, lng, radius = 5000) => 
    api.get('/geo/farmacias', { params: { lat, lng, radius } }),
}

export const couponService = {
  getActive: () => api.get('/cupons/ativos'),
  validate: (codigo, subtotal) => api.post('/cupons/validar', { codigo, subtotal }),
}

export const supportService = {
  send: (data) => api.post('/suporte', data),
  getById: (id) => api.get(`/suporte/${id}`),
  getHistory: () => api.get('/suporte'),
  getAllTickets: () => api.get('/suporte/admin/all'),
  assignTicket: (id) => api.post(`/suporte/admin/${id}/assign`),
  sendMessage: (id, data) => api.post(`/suporte/${id}/message`, data),
  closeTicket: (id) => api.post(`/suporte/${id}/close`),
}

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
  updatePassword: (senhaAtual, novaSenha) => 
    api.put('/users/senha', { senhaAtual, novaSenha }),
  addAddress: (data) => api.post('/users/addresses', data),
  getAddresses: () => api.get('/users/addresses'),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
  setDefaultAddress: (id) => api.patch(`/users/addresses/${id}/default`),
}

export default api
