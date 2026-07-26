import {
  computed,
  defineComponent,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  Transition,
  watch
} from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { loadConvoHistory } from 'actions'
import { isNonEmptyArray, throttle } from 'misc/utils'
import { HistoryMessages } from 'ui/messenger/ConvoHistory/HistoryMessages'
import { useConvoHistoryViewport } from 'ui/messenger/ConvoHistory/useConvoHistoryViewport'
import { ConvoTyping } from 'ui/messenger/ConvoTyping/ConvoTyping'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon24ChevronDown } from 'assets/icons'
import './ConvoHistory.css'

type Props = {
  convo: Convo.Convo
  openMessagePreview: (cmid: Message.Cmid) => void
}

const SHOW_HOP_NAVIGATION_THRESHOLD = 200
// Равен высоте футера чата, так как только при ее видимости браузер будет сохранять ее во вьюпорте
const PINNED_TO_BOTTOM_THRESHOLD = 32

export const ConvoHistory = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const { viewportPositions, scrollAnchors, typings } = useConvosStore()

  const scrollAnchor = computed(() => scrollAnchors.get(props.convo.id))
  const historySlice = computed(() => History.around(
    props.convo.history,
    props.convo.historySliceAnchorCmid,
    // При явной навигации не предпочитаем соседний слайс на границе гэпа:
    // ux будет лучше если мы покажем лоадер на весь экран вместо отображения соседних сообщений
    !scrollAnchor.value
  ))

  const windowSlice = computed(() => {
    const { fromIndex, toIndex, aroundIndex } = historySlice.value
    const from = aroundIndex === -1
      ? 0
      : Math.max(fromIndex, aroundIndex - messagesWindowWingSize.value)
    const to = aroundIndex === -1
      ? 0
      : Math.min(toIndex, aroundIndex + messagesWindowWingSize.value + 1)
    const items = props.convo.history.slice(from, to) as Array<History.Item<Message.Confirmed>>
    return {
      items,
      windowStart: items[0],
      windowEnd: items[items.length - 1],
      hasStartWindowOffset: aroundIndex !== -1 && from > fromIndex,
      hasEndWindowOffset: aroundIndex !== -1 && to < toIndex
    }
  })

  const $historyElement = shallowRef<HTMLElement | null>(null)
  const pinnedToBottom = shallowRef(true)
  const showHopNavigation = shallowRef(false)

  const {
    messagesWindowWingSize,
    scrollToAnchorIfNeeded,
    scrollToInitialPosition,
    findVisibleMessageRange,
    preserveMessagePosition,
    captureViewportPosition,
    restoreViewportPosition
  } = useConvoHistoryViewport(
    props.convo,
    $historyElement,
    computed(() => !!historySlice.value.gapAround),
    props.openMessagePreview
  )

  const moveWindowSlice = (anchorCmid: Message.Cmid) => {
    props.convo.historySliceAnchorCmid = anchorCmid
    preserveMessagePosition(anchorCmid)
  }

  onBeforeMount(() => {
    if (!scrollAnchor.value && !viewportPositions.has(props.convo.id)) {
      // Set last read message on first convo open
      props.convo.historySliceAnchorCmid = props.convo.inReadBy
    }
  })

  onMounted(() => {
    if (scrollAnchor.value) {
      scrollToAnchorIfNeeded(true)
      return
    }

    const viewportPosition = viewportPositions.get(props.convo.id)
    if (viewportPosition) {
      restoreViewportPosition(viewportPosition)
      return
    }

    if (props.convo.historySliceAnchorCmid) {
      scrollToInitialPosition(props.convo.historySliceAnchorCmid)
    }
  })

  onBeforeUnmount(() => {
    const viewportPosition = captureViewportPosition()
    viewportPositions.set(props.convo.id, viewportPosition)
  })

  watch(
    [scrollAnchor, historySlice],
    ([anchor], [prevAnchor]) => {
      // Выставляем instant если это не первый запрос на скролл к якорю,
      // то есть нам пришлось загрузить историю или перепрыгнуть на другой ее слайс,
      // и больше нет изначальной позиции, откуда можно применить анимацию
      scrollToAnchorIfNeeded(
        !!anchor &&
        anchor.kind === prevAnchor?.kind &&
        anchor.cmid === prevAnchor?.cmid
      )
    },
    { flush: 'post' }
  )

  // Move the anchor before pinnedToBottom becomes false and window adjustment screws everything up
  watch(() => windowSlice.value.hasEndWindowOffset, () => {
    if (scrollAnchor.value) {
      return
    }
    const { hasEndWindowOffset, windowEnd } = windowSlice.value
    if (hasEndWindowOffset && windowEnd && pinnedToBottom.value) {
      props.convo.historySliceAnchorCmid = windowEnd.item.cmid
    }
  }, { flush: 'pre' })

  const onScroll = throttle(() => {
    const historyElement = $historyElement.value
    if (!historyElement) {
      return
    }

    const distanceFromBottom =
      historyElement.scrollHeight - historyElement.scrollTop - historyElement.offsetHeight

    showHopNavigation.value = distanceFromBottom > SHOW_HOP_NAVIGATION_THRESHOLD
    pinnedToBottom.value =
      !historySlice.value.gapAfter &&
      !windowSlice.value.hasEndWindowOffset &&
      distanceFromBottom < PINNED_TO_BOTTOM_THRESHOLD
  }, 50)

  const handleHopNavigation = () => {
    const lastMessage = Convo.lastMessage(props.convo)
    if (!lastMessage) {
      return
    }

    const [, lastVisibleCmid] = findVisibleMessageRange()

    if (props.convo.inReadBy && lastVisibleCmid && props.convo.inReadBy >= lastVisibleCmid) {
      scrollAnchors.set(props.convo.id, { kind: 'Unread', cmid: props.convo.inReadBy })
    } else {
      scrollAnchors.set(props.convo.id, {
        kind: 'Message',
        cmid: lastMessage.cmid,
        highlight: false
      })
    }
  }

  const loadHistory = (direction: 'around' | 'up' | 'down', startId: number, gap: History.Gap) => {
    const startCmid = Message.resolveCmid(startId)
    const startedWithScrollAnchor = !!scrollAnchor.value

    loadConvoHistory({
      peerId: props.convo.id,
      startCmid,
      gap,
      direction,
      /**
       * Пользуемся колбэком вместо ожидания окончания асинхронного loadConvoHistory.
       * Дело в том, что возврат ответа из асинхронной операции происходит в отдельной микротаске,
       * а перед выполнением этой микротаски могут успеть исполниться другие макро- и микротаски.
       * Так и происходит: после окончания асинхронного loadConvoHistory у нас уже перерендерен
       * компонент и обновлен дом, из-за чего нам неизвестно предыдущее положение вьюпорта
       */
      async onHistoryInserted() {
        /**
         * Пока есть scrollAnchor, он сам управляет позиционированием.
         *
         * Если scrollAnchor был только на момент начала загрузки, то это означает что он
         * уже произвел позиционирование, и пользователь мог далее изменить позицию скролла.
         * В данном случае мы просто сохраним текущую позицию вьюпорта.
         *
         * Если scrollAnchor вовсе не было, то никто другой не управлял скроллом,
         * и мы можем спокойно определять изначальную позицию на основе startCmid
         */
        if (scrollAnchor.value) {
          return
        }

        const [topMessageCmid] = findVisibleMessageRange()
        if (topMessageCmid) {
          // History loading doesn't change it itself, so we would be around the window boundary...
          props.convo.historySliceAnchorCmid = topMessageCmid
          preserveMessagePosition(topMessageCmid)
          return
        }

        if (!startedWithScrollAnchor) {
          // In case we already closed the convo it'd be useful to have a precise message to target
          // on next convo open
          props.convo.historySliceAnchorCmid = startCmid
          // No messages in viewport almost always means we are still at around gap loading
          await nextTick()
          scrollToInitialPosition(startCmid)
        }
      }
    })
  }

  return () => {
    const { effectiveAroundId, gapBefore, gapAround, gapAfter } = historySlice.value
    const { items, windowStart, windowEnd, hasStartWindowOffset, hasEndWindowOffset } =
      windowSlice.value
    const messages = [
      ...items.map(({ item }) => item),
      ...(!gapAfter && !hasEndWindowOffset ? props.convo.pendingMessages : [])
    ]

    if (gapAround) {
      return (
        <div class="ConvoHistory__placeholder">
          <HistoryBoundary
            key={effectiveAroundId}
            direction="around"
            peerId={props.convo.id}
            startId={effectiveAroundId}
            onReach={() => loadHistory('around', effectiveAroundId, gapAround)}
          />
        </div>
      )
    }

    if (messages.length === 0) {
      return (
        <div class="ConvoHistory__placeholder">
          {lang.use('me_convo_empty_placeholder')}
        </div>
      )
    }

    const typingUsers = typings.get(props.convo.id)

    return (
      <div class="ConvoHistory">
        <div class="ConvoHistory__scroll" ref={$historyElement} onScrollPassive={onScroll}>
          <div
            class={[
              'ConvoHistory__content',
              pinnedToBottom.value && 'ConvoHistory__content--pinnedToBottom'
            ]}
          >
            <div class="ConvoHistory__topFiller" />

            {windowStart && hasStartWindowOffset ? (
              <WindowBoundary
                key={windowStart.id}
                onReach={() => moveWindowSlice(windowStart.item.cmid)}
              />
            ) : gapBefore ? (
              <HistoryBoundary
                key={gapBefore.toId}
                direction="up"
                peerId={props.convo.id}
                startId={gapBefore.toId}
                onReach={() => loadHistory('up', gapBefore.toId, gapBefore)}
              />
            ) : null}

            <HistoryMessages
              convo={props.convo}
              messages={messages}
              hasMessagesAbove={!!gapBefore || hasStartWindowOffset}
              openMessagePreview={props.openMessagePreview}
            />

            {windowEnd && hasEndWindowOffset ? (
              <WindowBoundary
                key={windowEnd.id}
                onReach={() => moveWindowSlice(windowEnd.item.cmid)}
              />
            ) : gapAfter ? (
              <HistoryBoundary
                key={gapAfter.fromId}
                direction="down"
                peerId={props.convo.id}
                startId={gapAfter.fromId}
                onReach={() => loadHistory('down', gapAfter.fromId, gapAfter)}
              />
            ) : null}

            <div class="ConvoHistory__footer">
              {!gapAfter && !hasEndWindowOffset && typingUsers && isNonEmptyArray(typingUsers) && (
                <ConvoTyping
                  typingUsers={typingUsers}
                  namesLimit={props.convo.kind === 'ChatConvo' ? undefined : 0}
                />
              )}
            </div>
          </div>
        </div>

        <Transition name="ConvoHistory__hopNavigation-">
          {(showHopNavigation.value || !!gapAfter || hasEndWindowOffset) && (
            <div class="ConvoHistory__hopNavigation">
              <ButtonIcon
                class="ConvoHistory__hopNavigationButton"
                shiftOnClick
                icon={<Icon24ChevronDown />}
                onClick={handleHopNavigation}
              />
            </div>
          )}
        </Transition>
      </div>
    )
  }
}, {
  props: ['convo', 'openMessagePreview']
})

type HistoryBoundaryProps = {
  direction: 'around' | 'up' | 'down'
  peerId: Peer.Id
  startId: number
  onReach: () => void
}

const HistoryBoundary = defineComponent<HistoryBoundaryProps>((props) => {
  const { loadConvoHistoryLock } = useConvosStore()

  return () => {
    const lock = loadConvoHistoryLock.get(`${props.peerId}-${props.direction}`)

    if (lock?.status === 'error' && lock.startCmid === props.startId) {
      return <LoadError onRetry={props.onReach} />
    }

    return (
      <IntersectionWrapper onIntersect={props.onReach}>
        <Spinner size="regular" class="ConvoHistory__spinner" />
      </IntersectionWrapper>
    )
  }
}, {
  props: ['direction', 'peerId', 'startId', 'onReach']
})

type WindowBoundaryProps = {
  onReach: () => void
}

const WindowBoundary = defineComponent<WindowBoundaryProps>((props) => {
  return () => (
    <IntersectionWrapper onIntersect={props.onReach}>
      <div />
    </IntersectionWrapper>
  )
}, {
  props: ['onReach']
})
