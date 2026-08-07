import {
  computed,
  defineComponent,
  nextTick,
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
import { LoadConvoHistoryLock, useConvosStore } from 'store/convos'
import { loadConvoHistory } from 'actions'
import { getMapValueOrCompute, isNonEmptyArray, throttle } from 'misc/utils'
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
  const { typings, convoSessions } = useConvosStore()

  const convoSession = getMapValueOrCompute(convoSessions, props.convo.id, () => ({
    anchorCmid: props.convo.inReadBy,
    loadLocks: new Map()
  }))

  const historySlice = computed(() => History.around(
    props.convo.history,
    convoSession.anchorCmid,
    // При явной навигации не предпочитаем соседний слайс на границе гэпа:
    // ux будет лучше если мы покажем лоадер на весь экран вместо отображения соседних сообщений
    !convoSession.navigationRequest
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
    advanceNavigationRequest,
    scrollToInitialPosition,
    findVisibleMessageRange,
    preserveMessagePosition,
    captureViewportPosition,
    restoreViewportPosition
  } = useConvoHistoryViewport(
    props.convo,
    convoSession,
    $historyElement,
    computed(() => !!historySlice.value.gapAround),
    props.openMessagePreview
  )

  const moveWindowSlice = (anchorCmid: Message.Cmid) => {
    convoSession.anchorCmid = anchorCmid
    preserveMessagePosition(anchorCmid)
  }

  onMounted(() => {
    convoSession.onHistoryLoadComplete = onHistoryLoadComplete

    if (convoSession.navigationRequest) {
      advanceNavigationRequest(true)
      return
    }

    if (convoSession.viewportPosition) {
      restoreViewportPosition(convoSession.viewportPosition)
      return
    }

    if (convoSession.anchorCmid) {
      scrollToInitialPosition(convoSession.anchorCmid)
    }
  })

  onBeforeUnmount(() => {
    convoSession.viewportPosition = captureViewportPosition()
  })

  watch(
    [() => convoSession.navigationRequest, historySlice],
    ([request], [prevRequest]) => {
      // Выставляем instantScroll если это не шаг навигации,
      // то есть нам пришлось загрузить историю или перепрыгнуть на другой ее слайс,
      // и больше нет изначальной позиции, откуда можно применить анимацию
      advanceNavigationRequest(request === prevRequest)
    },
    { flush: 'post' }
  )

  // Move the anchor before pinnedToBottom becomes false and window adjustment screws everything up
  watch(() => windowSlice.value.hasEndWindowOffset, () => {
    if (convoSession.navigationRequest) {
      return
    }
    const { hasEndWindowOffset, windowEnd } = windowSlice.value
    if (hasEndWindowOffset && windowEnd && pinnedToBottom.value) {
      convoSession.anchorCmid = windowEnd.item.cmid
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
      convoSession.navigationRequest = { kind: 'Unread', cmid: props.convo.inReadBy }
    } else {
      convoSession.navigationRequest = {
        kind: 'Message',
        cmid: lastMessage.cmid,
        highlight: false
      }
    }
  }

  const loadHistory = (direction: 'around' | 'up' | 'down', startId: number, gap: History.Gap) => {
    loadConvoHistory({
      peerId: props.convo.id,
      startCmid: Message.resolveCmid(startId),
      gap,
      direction
    })
  }

  const onHistoryLoadComplete = async (startCmid: Message.Cmid) => {
    if (convoSession.navigationRequest) {
      return
    }

    const [topMessageCmid] = findVisibleMessageRange()
    if (topMessageCmid) {
      // History loading doesn't change it itself, so we would be around the window boundary...
      convoSession.anchorCmid = topMessageCmid
      preserveMessagePosition(topMessageCmid)
      return
    }

    // No messages in viewport means we either closed the convo or on the around gap loader
    await nextTick()
    scrollToInitialPosition(startCmid)
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
            lock={convoSession.loadLocks.get('around')}
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
                lock={convoSession.loadLocks.get('up')}
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
                lock={convoSession.loadLocks.get('down')}
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
  lock: LoadConvoHistoryLock | undefined
  startId: number
  onReach: () => void
}

const HistoryBoundary = defineComponent<HistoryBoundaryProps>((props) => {
  return () => {
    if (props.lock?.status === 'error' && props.lock.startCmid === props.startId) {
      return <LoadError onRetry={props.onReach} />
    }

    return (
      <IntersectionWrapper onIntersect={props.onReach}>
        <Spinner size="regular" class="ConvoHistory__spinner" />
      </IntersectionWrapper>
    )
  }
}, {
  props: ['lock', 'startId', 'onReach']
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
