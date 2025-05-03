import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  provide,
  ref,
  shallowRef,
  Transition,
  watch
} from 'vue'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { ScrollAnchor, useConvosStore } from 'store/convos'
import { loadConvoHistory } from 'actions'
import { useEnv, useResizeObserver } from 'hooks'
import { isNonEmptyArray } from 'misc/utils'
import { convoHistoryContextInjectKey } from 'misc/providers'
import { HistoryMessages } from 'ui/messenger/ConvoHistory/HistoryMessages'
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

const PINNED_TO_BOTTOM_THRESHOLD = 20
const SHOW_HOP_NAVIGATION_THRESHOLD = 200

export const ConvoHistory = defineComponent<Props>((props) => {
  const { lang } = useEnv()
  const { savedScrollPositions, scrollAnchors, typings } = useConvosStore()
  const scrollAnchor = computed<ScrollAnchor>(
    () => scrollAnchors.get(props.convo.id) ?? { kind: 'None' }
  )
  const historySlice = computed(() => History.around(
    props.convo.history,
    props.convo.historyAroundCmid,
    scrollAnchor.value.kind !== 'None'
  ))
  const $historyElement = shallowRef<HTMLDivElement | null>(null)
  const messageElements = ref(new Map<Message.Cmid | 'unread', HTMLElement>()).value
  const prevPinnedToBottom = shallowRef(false)
  const showHopNavigation = shallowRef(false)
  let newConvoHistoryJustRendered = false

  const historyWidth = shallowRef(0)
  const historyHeight = shallowRef(0)

  useResizeObserver($historyElement, (entry) => {
    historyWidth.value = entry.contentRect.width
    historyHeight.value = entry.contentRect.height
  })

  provide(convoHistoryContextInjectKey, {
    historyViewportWidth: historyWidth,
    historyViewportHeight: historyHeight
  })

  watch($historyElement, () => {
    if (!$historyElement.value) {
      return
    }

    historyWidth.value = $historyElement.value.offsetWidth
    historyHeight.value = $historyElement.value.offsetHeight
  })

  onMounted(async () => {
    if (scrollToAnchorIfNeeded(true)) {
      return
    }

    const scrollTop = savedScrollPositions.get(props.convo.id)
    if ($historyElement.value && scrollTop !== undefined) {
      // После первого рендера в истории могут произойти некоторые изменения, например
      // просчитаться актуальные размеры сеток фотографий, поэтому ждем дополнительный тик
      await nextTick()
      $historyElement.value.scrollTop = scrollTop
    }
  })

  onBeforeUnmount(() => {
    if ($historyElement.value) {
      savedScrollPositions.set(props.convo.id, $historyElement.value.scrollTop)
    }
  })

  onBeforeUpdate(() => {
    const historyElement = $historyElement.value
    if (historyElement) {
      /**
       * scrollTop - высота от верха контента до верха вьюпорта
       * offsetHeight - высота вьюпорта
       * scrollHeight - общая высота контента
       */
      const heightBelowViewport =
        historyElement.scrollHeight - historyElement.scrollTop - historyElement.offsetHeight
      prevPinnedToBottom.value = heightBelowViewport <= PINNED_TO_BOTTOM_THRESHOLD
    }
  })

  onUpdated(async () => {
    if (newConvoHistoryJustRendered || scrollAnchor.value.kind !== 'None') {
      newConvoHistoryJustRendered = false
      return
    }

    const historyElement = $historyElement.value
    if (!historyElement) {
      return
    }

    // Чтобы фотографии успели высчитать свое значение
    await nextTick()

    /**
     * Автоматически скроллим до низа истории, если перед ререндером мы находились внизу,
     * но впоследствии ререндера оказались выше.
     * Основной сценарий - когда мы или собеседник написали новое сообщение
     */
    const { scrollHeight, scrollTop, offsetHeight } = historyElement
    const heightBelowViewport = scrollHeight - scrollTop - offsetHeight
    const isPinnedToBottom = heightBelowViewport <= PINNED_TO_BOTTOM_THRESHOLD

    if (prevPinnedToBottom.value && !isPinnedToBottom) {
      historyElement.scrollTo(0, scrollHeight)
    }
  })

  const scrollToAnchorIfNeeded = (instant: boolean) => {
    const anchor = scrollAnchor.value
    if (anchor.kind === 'None') {
      return
    }

    const element = scrollAnchor.value.kind === 'Unread'
      ? messageElements.get('unread') ?? messageElements.get(anchor.cmid)
      : messageElements.get(anchor.cmid)
    const behavior = instant ? 'instant' : 'smooth'

    if (element) {
      // По неведомой причине scrollIntoView с behavior: smooth не работает сразу же
      nextTick(() => {
        scrollAnchors.set(props.convo.id, { kind: 'None' })

        element.scrollIntoView({
          block: 'center',
          behavior
        })
      })

      return true
    }

    if (props.convo.historyAroundCmid !== anchor.cmid) {
      props.convo.historyAroundCmid = anchor.cmid
      return
    }

    if (historySlice.value.gapAround) {
      return
    }

    // Сообщения не оказалось в истории даже после загрузки истории вокруг кмида
    // TODO: показать модалку с превью сообщения
    // TODO: возвращаться обратно к сообщению откуда мы пытались перейти к другому сообщению
    // (либо предварительно смотреть в апи наличие сообщения и не грузить историю вообще)

    // Пока не реализована обработка ненайденного сообщения, скроллим к ближайшему следующему
    const messageCmids = [...messageElements.keys()]
      .filter((key) => key !== 'unread')
      .sort((a, b) => a - b)
    const messageCmid =
      messageCmids.find((cmid) => (cmid >= anchor.cmid)) ??
      messageCmids.at(-1)
    const messageElement = messageCmid && messageElements.get(messageCmid)

    if (messageElement) {
      nextTick(() => {
        scrollAnchors.set(props.convo.id, { kind: 'None' })

        messageElement.scrollIntoView({
          block: 'center',
          behavior
        })
      })

      return true
    }
  }

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

  const onScroll = () => {
    const historyElement = $historyElement.value
    if (!historyElement) {
      return
    }

    const distanceFromBottom =
      historyElement.scrollHeight - historyElement.scrollTop - historyElement.offsetHeight

    showHopNavigation.value = distanceFromBottom > SHOW_HOP_NAVIGATION_THRESHOLD
  }

  const handleHopNavigation = () => {
    const lastMessage = Convo.lastMessage(props.convo)
    if (!lastMessage) {
      return
    }

    if (props.convo.inReadBy && props.convo.inReadBy > props.convo.historyAroundCmid) {
      scrollAnchors.set(props.convo.id, { kind: 'Unread', cmid: props.convo.inReadBy })
    } else {
      // TODO: опция для отключения выделения
      scrollAnchors.set(props.convo.id, { kind: 'Message', cmid: lastMessage.cmid })
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
       * компонент и обновлен дом, из-за чего мы не можем достать предыдущий scrollHeight
       */
      onHistoryInserted(insertedMessages) {
        newConvoHistoryJustRendered = true
        correctScrollPosition(insertedMessages, direction, startCmid)
      }
    })
  }

  const correctScrollPosition = async (
    insertedMessages: Message.Confirmed[],
    direction: 'around' | 'up' | 'down',
    startCmid: Message.Cmid
  ) => {
    if (direction === 'around') {
      await nextTick()

      // В случае around элемент нужно доставать только после nextTick,
      // так как до этого момента он еще не успел замениться с лоадера чата
      const historyElement = $historyElement.value
      if (!historyElement) {
        return
      }

      if (startCmid === props.convo.inReadBy) {
        const unreadElement = messageElements.get('unread')
        if (unreadElement) {
          // Скроллим к блоку непрочитанных так, чтобы он начинался на верхней 1/4 части вьюпорта
          historyElement.scrollTop =
            unreadElement.offsetTop - historyElement.offsetTop - historyHeight.value / 4
          return
        }
      }

      // При загрузке вокруг кмида этого сообщения может не оказаться, тогда мы возьмем следующее
      const aroundMessage =
        insertedMessages.find(({ cmid }) => (cmid >= startCmid)) ??
        insertedMessages.at(-1)

      const messageElement = aroundMessage && messageElements.get(aroundMessage.cmid)
      messageElement?.scrollIntoView({
        block: 'center',
        behavior: 'instant'
      })
      return
    }

    const historyElement = $historyElement.value
    if (!historyElement) {
      return
    }

    const { scrollTop, scrollHeight } = historyElement
    await nextTick()

    if (direction === 'up') {
      historyElement.scrollTop = scrollTop + historyElement.scrollHeight - scrollHeight
    } else {
      historyElement.scrollTop = scrollTop
    }
  }

  return () => {
    const { items, matchedAroundId, gapBefore, gapAround, gapAfter } = historySlice.value
    const messages = [
      ...items.map(({ item }) => item),
      ...props.convo.pendingMessages
    ]

    if (gapAround) {
      return (
        <div class="ConvoHistory__placeholder">
          <HistoryLoader
            direction="around"
            startId={matchedAroundId}
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
          <div class="ConvoHistory__content">
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
                  namesLimit={
                    props.convo.kind === 'UserConvo' || props.convo.kind === 'GroupConvo'
                      ? 0
                      : undefined
                  }
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
                withHoverBackground={false}
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

  return () => {
    const lockStatus = loadConvoHistoryLock.get(`${props.peerId}-${props.direction}`)
    const onLoad = () => props.loadHistory(
      props.direction,
      Message.resolveCmid(props.startId),
      props.gap
    )

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
