import {
  computed,
  defineComponent,
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
  onMessageUnavailable: (cmid: Message.Cmid) => void
}

const SHOW_HOP_NAVIGATION_THRESHOLD = 200
// Равен высоте футера чата, так как только при ее видимости браузер будет сохранять ее во вьюпорте
const PINNED_TO_BOTTOM_THRESHOLD = 32
const MESSAGES_WINDOW_WING_SIZE = 20

export const ConvoHistory = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const { savedScrollPositions, scrollAnchors, typings } = useConvosStore()

  const scrollAnchor = computed(() => scrollAnchors.get(props.convo.id))
  const historySlice = computed(() => History.around(
    props.convo.history,
    props.convo.historySliceAnchorCmid,
    !scrollAnchor.value
  ))

  const windowSlice = computed(() => {
    const { fromIndex, toIndex, aroundIndex } = historySlice.value
    const from = aroundIndex === -1
      ? 0
      : Math.max(fromIndex, aroundIndex - MESSAGES_WINDOW_WING_SIZE)
    const to = aroundIndex === -1
      ? 0
      : Math.min(toIndex, aroundIndex + MESSAGES_WINDOW_WING_SIZE + 1)
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
  const pinnedToBottom = shallowRef(false)
  const showHopNavigation = shallowRef(false)

  const {
    scrollToAnchorIfNeeded,
    preserveMessagePosition,
    preserveViewportPosition
  } = useConvoHistoryViewport(
    props.convo,
    $historyElement,
    props.onMessageUnavailable
  )

  const moveWindowSlice = (anchorCmid: Message.Cmid) => {
    props.convo.historySliceAnchorCmid = anchorCmid
    preserveMessagePosition(anchorCmid)
  }

  onMounted(() => {
    if (scrollToAnchorIfNeeded(true)) {
      return
    }

    const scrollTop = savedScrollPositions.get(props.convo.id)
    if ($historyElement.value && scrollTop !== undefined) {
      $historyElement.value.scrollTop = scrollTop
    }
  })

  onBeforeUnmount(() => {
    if ($historyElement.value) {
      savedScrollPositions.set(props.convo.id, $historyElement.value.scrollTop)
    }
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

    if (props.convo.inReadBy && props.convo.inReadBy > props.convo.historySliceAnchorCmid) {
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
      onHistoryInserted(insertedMessages) {
        preserveViewportPosition(insertedMessages, direction, startCmid)
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
                onReach={() => loadHistory('up', gapBefore.toId, gapBefore)}
              />
            ) : null}

            <HistoryMessages messages={messages} convo={props.convo} />

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
  props: ['convo', 'onMessageUnavailable']
})

type HistoryBoundaryProps = {
  direction: 'around' | 'up' | 'down'
  peerId: Peer.Id
  onReach: () => void
}

const HistoryBoundary = defineComponent<HistoryBoundaryProps>((props) => {
  const { loadConvoHistoryLock } = useConvosStore()

  return () => {
    const lockStatus = loadConvoHistoryLock.get(`${props.peerId}-${props.direction}`)

    if (lockStatus === 'error') {
      return <LoadError onRetry={props.onReach} />
    }

    return (
      <IntersectionWrapper onIntersect={props.onReach}>
        <Spinner size="regular" class="ConvoHistory__spinner" />
      </IntersectionWrapper>
    )
  }
}, {
  props: ['direction', 'peerId', 'onReach']
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
