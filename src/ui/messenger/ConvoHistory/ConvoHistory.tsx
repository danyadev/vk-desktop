import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  Transition,
  watch
} from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { ScrollAnchor, useConvosStore } from 'store/convos'
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
}

const SHOW_HOP_NAVIGATION_THRESHOLD = 200
// Равен высоте футера чата, так как только при ее видимости браузер будет сохранять ее во вьюпорте
const PINNED_TO_BOTTOM_THRESHOLD = 32

export const ConvoHistory = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const { savedScrollPositions, scrollAnchors, typings } = useConvosStore()
  const scrollAnchor = computed<ScrollAnchor>(
    () => scrollAnchors.get(props.convo.id) ?? { kind: 'None' }
  )
  const historySlice = computed(() => History.around(
    props.convo.history,
    props.convo.historySliceAnchorCmid,
    scrollAnchor.value.kind === 'None'
  ))

  const $historyElement = shallowRef<HTMLDivElement | null>(null)
  const messageElements = ref(new Map<Message.Cmid | 'unread', HTMLElement>()).value
  const pinnedToBottom = shallowRef(false)
  const showHopNavigation = shallowRef(false)

  const { scrollToAnchorIfNeeded, preserveViewportPosition } = useConvoHistoryViewport(
    props.convo,
    $historyElement,
    historySlice,
    messageElements
  )

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
        anchor.kind !== 'None' &&
        anchor.kind === prevAnchor.kind &&
        anchor.cmid === prevAnchor.cmid
      )
    },
    { flush: 'post' }
  )

  const onScroll = throttle(() => {
    const historyElement = $historyElement.value
    if (!historyElement) {
      return
    }

    const distanceFromBottom =
      historyElement.scrollHeight - historyElement.scrollTop - historyElement.offsetHeight

    showHopNavigation.value = distanceFromBottom > SHOW_HOP_NAVIGATION_THRESHOLD
    pinnedToBottom.value =
      !historySlice.value.gapAfter && distanceFromBottom < PINNED_TO_BOTTOM_THRESHOLD
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

  const loadHistory = (
    direction: 'around' | 'up' | 'down',
    startCmid: Message.Cmid,
    gap: History.Gap
  ) => {
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
    const { items, effectiveAroundId, gapBefore, gapAround, gapAfter } = historySlice.value
    const messages = [
      ...items.map(({ item }) => item),
      ...(!gapAfter ? props.convo.pendingMessages : [])
    ]

    if (gapAround) {
      return (
        <div class="ConvoHistory__placeholder">
          <HistoryLoader
            direction="around"
            startId={effectiveAroundId}
            gap={gapAround}
            peerId={props.convo.id}
            loadHistory={loadHistory}
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

            {gapBefore && (
              <HistoryLoader
                direction="up"
                startId={gapBefore.toId}
                gap={gapBefore}
                peerId={props.convo.id}
                loadHistory={loadHistory}
              />
            )}

            <HistoryMessages
              messages={messages}
              messageElements={messageElements}
              convo={props.convo}
            />

            {gapAfter && (
              <HistoryLoader
                direction="down"
                startId={gapAfter.fromId}
                gap={gapAfter}
                peerId={props.convo.id}
                loadHistory={loadHistory}
              />
            )}

            <div class="ConvoHistory__footer">
              {!gapAfter && typingUsers && isNonEmptyArray(typingUsers) && (
                <ConvoTyping
                  typingUsers={typingUsers}
                  namesLimit={props.convo.kind === 'ChatConvo' ? undefined : 0}
                />
              )}
            </div>
          </div>
        </div>

        <Transition name="ConvoHistory__hopNavigation-">
          {(showHopNavigation.value || gapAfter) && (
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
  props: ['convo']
})

type HistoryLoaderProps = {
  peerId: Peer.Id
  direction: 'around' | 'up' | 'down'
  startId: number
  gap: History.Gap
  loadHistory: (
    direction: 'around' | 'up' | 'down',
    startCmid: Message.Cmid,
    gap: History.Gap
  ) => void
}

const HistoryLoader = defineComponent<HistoryLoaderProps>((props) => {
  const { loadConvoHistoryLock } = useConvosStore()

  const onLoad = () => props.loadHistory(
    props.direction,
    Message.resolveCmid(props.startId),
    props.gap
  )

  return () => {
    const lockStatus = loadConvoHistoryLock.get(`${props.peerId}-${props.direction}`)

    if (lockStatus === 'error') {
      return <LoadError onRetry={onLoad} key={props.startId} />
    }

    return (
      <IntersectionWrapper onIntersect={onLoad} key={props.startId}>
        <Spinner size="regular" class="ConvoHistory__spinner" />
      </IntersectionWrapper>
    )
  }
}, {
  props: ['peerId', 'direction', 'startId', 'gap', 'loadHistory']
})
