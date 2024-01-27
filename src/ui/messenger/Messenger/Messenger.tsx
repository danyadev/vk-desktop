import { computed, defineComponent, KeyboardEvent, onMounted, shallowRef } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { loadInitialData } from 'actions'
import { ConvoList } from 'ui/messenger/ConvoList/ConvoList'
import './Messenger.css'

export const Messenger = defineComponent(() => {
  const route = useRoute()
  const router = useRouter()
  const columnsLayout = useColumnsLayout()

  onMounted(() => {
    loadInitialData()
  })

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && route.name === 'Convo') {
      router.push('/')
    }
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
