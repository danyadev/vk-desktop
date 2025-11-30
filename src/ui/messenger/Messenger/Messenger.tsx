import { computed, defineComponent, KeyboardEvent, onMounted, shallowRef } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import * as IEngine from 'env/IEngine'
import { FailReason } from 'env/IEngine'
import { loadInitialData } from 'actions'
import { useEnv, useModal } from 'hooks'
import { ConvoList } from 'ui/messenger/ConvoList/ConvoList'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import './Messenger.css'

export const Messenger = defineComponent(() => {
  const route = useRoute()
  const router = useRouter()
  const columnsLayout = useColumnsLayout()
  const initErrorModal = useModal()
  const engineFailModal = useModal()
  const engineFailReason = shallowRef('')
  const { lang } = useEnv()

  onMounted(() => {
    loadInitialData(initErrorModal.open, onEngineFail)
  })

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && route.name === 'Convo') {
      if (route.query.canGoBack) {
        router.back()
      } else {
        router.push({ name: 'NoConvo' })
      }
    }
  }

  const onEngineFail = (reason: IEngine.FailReason) => {
    engineFailModal.open()

    switch (reason) {
      case FailReason.RETRIEVE_KEY_ERROR:
        engineFailReason.value = lang.use('engineFailModal_description_retrieve_key')
        break
      case FailReason.RESYNC_ERROR:
        engineFailReason.value = lang.use('engineFailModal_description_resync')
        break
      case FailReason.INVALIDATE_CACHE:
        engineFailReason.value = lang.use('engineFailModal_description_invalidate_cache')
        break
      case FailReason.OTHER:
        engineFailReason.value = lang.use('engineFailModal_description_other')
        break
    }
  }

  const closeInitErrorModal = () => {
    initErrorModal.close()
    loadInitialData(initErrorModal.open, onEngineFail)
  }

  return () => (
    <div
      class={['Messenger', route.name === 'Convo' && 'Messenger--withConvo']}
      onKeydown={onKeydown}
      tabindex={-1}
    >
      <ConvoList class="Messenger__convoList" compact={columnsLayout.value === 'compact'} />

      <div class="Messenger__content">
        <RouterView key={route.path} />
      </div>

      <Modal
        opened={initErrorModal.opened}
        onClose={closeInitErrorModal}
        title={lang.use('initErrorModal_title')}
        buttons={
          <Button onClick={closeInitErrorModal}>
            {lang.use('initErrorModal_retry')}
          </Button>
        }
      >
        {lang.use('initErrorModal_text')}
      </Modal>

      <Modal
        opened={engineFailModal.opened}
        onClose={engineFailModal.close}
        title={lang.use('engineFailModal_title')}
        buttons={[
          <Button onClick={() => location.reload()}>{lang.use('engineFailModal_reload')}</Button>,
          <Button onClick={engineFailModal.close}>{lang.use('modal_close_label')}</Button>
        ]}
        class="EngineFailModal"
      >
        {engineFailReason.value}
        <br /><br />
        {lang.use('engineFailModal_reload_note')}
      </Modal>
    </div>
  )
})

function useColumnsLayout() {
  const oneColumnQuery = window.matchMedia('(width < 500px)')
  const compactTwoColumnQuery = window.matchMedia('(width <= 700px)')

  const isOneColumn = shallowRef(oneColumnQuery.matches)
  const isCompactTwoColumn = shallowRef(compactTwoColumnQuery.matches)

  oneColumnQuery.addEventListener('change', ({ matches }) => {
    isOneColumn.value = matches
  })
  compactTwoColumnQuery.addEventListener('change', ({ matches }) => {
    isCompactTwoColumn.value = matches
  })

  return computed(() => {
    if (isOneColumn.value) {
      return 'single'
    }
    if (isCompactTwoColumn.value) {
      return 'compact'
    }
    return 'dual'
  })
}
