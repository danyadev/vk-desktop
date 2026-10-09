import { inject, InjectionKey, provide } from 'vue'
import { ConvoSession } from 'store/convos'

const convoSessionInjectKey: InjectionKey<ConvoSession> = Symbol('convoSession')

export function provideConvoSession(session: ConvoSession) {
  provide(convoSessionInjectKey, session)
}

export const useConvoSession = () => {
  const context = inject(convoSessionInjectKey)
  if (!context) {
    throw new Error('No ConvoSession provided')
  }
  return context
}
