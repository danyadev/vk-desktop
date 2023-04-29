import { computed, InjectionKey, reactive } from 'vue'
import { Api } from 'env/Api'
import { Engine } from 'env/Engine'
import { Lang } from 'env/Lang'
import { useSettingsStore } from 'store/settings'

export const ENV_PROVIDE_KEY: InjectionKey<ReturnType<typeof createEnv>> = Symbol()

export function createEnv() {
  const settings = useSettingsStore()

  const lang = computed(() => new Lang(settings.lang))
  const api = new Api()
  const engine = new Engine()

  return reactive({
    lang,
    api,
    engine
  })
}
