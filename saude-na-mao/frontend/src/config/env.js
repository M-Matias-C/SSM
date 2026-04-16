
const requiredEnvVars = [
  'VITE_API_BASE_URL',
]

const optionalEnvVars = [
  'VITE_APP_NAME',
  'VITE_LOG_LEVEL',
]

export const validateEnv = () => {
  const missing = []

  requiredEnvVars.forEach((envVar) => {
    if (!import.meta.env[envVar]) {
      missing.push(envVar)
    }
  })

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`
    console.error(message)
    throw new Error(message)
  }

  console.info('✅ Environment variables validated')
}

export const getConfig = () => {
  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    appName: import.meta.env.VITE_APP_NAME || 'Saúde na Mão',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  }
}
