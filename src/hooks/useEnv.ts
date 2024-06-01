import { inject } from 'vue'
import { ENV_PROVIDE_KEY } from 'env/createEnv'

export function useEnv() {
  const env = inject(ENV_PROVIDE_KEY)

  if (!env) {
    throw new Error('useEnv был вызван вне контекста приложения')
  }

  return env
}
