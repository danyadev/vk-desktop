import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  provide,
  shallowRef,
  watch
} from 'vue'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import { useConvosStore } from 'store/convos'
import { loadConvoHistory } from 'actions'
import { useEnv, useResizeObserver } from 'hooks'
import { isNonEmptyArray, NonEmptyArray } from 'misc/utils'
import { isPreviousDay, isSameDay } from 'misc/dateTime'
import { convoHistoryContextInjectKey } from 'misc/providers'
import { ConvoTyping } from 'ui/messenger/ConvoTyping/ConvoTyping'
import { MessagesStack } from 'ui/messenger/MessagesStack/MessagesStack'
import { Button } from 'ui/ui/Button/Button'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ConvoHistory.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoHistory = defineComponent<Props>((props) => {
  const { lang } = useEnv()
  const { loadConvoHistoryLock, savedConvoScroll, typings } = useConvosStore()
  const historySlice = computed(() => History.around(props.convo.history, props.convo.inReadBy))
  const $historyElement = shallowRef<HTMLDivElement | null>(null)
  const prevScrollHeight = shallowRef(0)
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
    const scrollTop = savedConvoScroll.get(props.convo.id)
    if ($historyElement.value && scrollTop !== undefined) {
      // После первого рендера в истории могут произойти некоторые изменения, например
      // просчитаться актуальные размеры сеток фотографий, поэтому ждем дополнительный тик.
      await nextTick()
      $historyElement.value.scrollTop = scrollTop
    }
  })

  onBeforeUnmount(() => {
    if ($historyElement.value) {
      savedConvoScroll.set(props.convo.id, $historyElement.value.scrollTop)
    }
  })

  onBeforeUpdate(() => {
    if ($historyElement.value) {
      prevScrollHeight.value = $historyElement.value.scrollHeight
    }
  })

  onUpdated(() => {
    if (newConvoHistoryJustRendered) {
      newConvoHistoryJustRendered = false
      return
    }

    if (!$historyElement.value) {
      return
    }

    /**
     * Автоматически скроллим до низа истории, если перед ререндером мы находились внизу,
     * но впоследствии ререндера оказались выше.
     * Основной сценарий - когда мы или собеседник написали новое сообщение
     *
     * scrollTop - высота от верха контента до верха вьюпорта;
     * offsetHeight - высота вьюпорта;
     * scrollHeight - общая высота контента.
     *
     * Сумма scrollTop и offsetHeight равна высоте от верха контента до конца вьюпорта.
     * Если мы находимся в самом низу, то она будет совпадать с общей высотой, но если
     * мы проскроллим вверх, появляется контент под вьюпортом, который нам не виден.
     * Тогда сумма не совпадет и мы поймем что юзер не находится внизу
     */
    const upperContentHeight = $historyElement.value.scrollTop + $historyElement.value.offsetHeight

    if (prevScrollHeight.value - upperContentHeight < 20) {
      $historyElement.value.scrollTo(0, $historyElement.value.scrollHeight)
    }
  })

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

      const historyElement = $historyElement.value
      if (!historyElement) {
        return
      }

      if (startCmid === props.convo.inReadBy) {
        const unreadBlock = historyElement.querySelector<HTMLElement>('.ConvoHistory__unreadBlock')
        if (unreadBlock) {
          historyElement.scrollTop =
            unreadBlock.offsetTop - historyElement.offsetTop - historyHeight.value / 4
          return
        }
      }

      // При загрузке вокруг кмида этого сообщения может не оказаться, тогда мы возьмем следующее
      const aroundMessage =
        insertedMessages.find(({ cmid }) => (cmid >= startCmid)) ??
        insertedMessages.at(-1)

      const messageElement = aroundMessage && historyElement.querySelector(
        `.MessagesStack__message[data-cmid="${aroundMessage.cmid}"]`
      )
      messageElement?.scrollIntoView({
        block: 'center',
        behavior: 'instant'
      })
    }

    if (direction === 'up') {
      const historyElement = $historyElement.value
      if (!historyElement) {
        return
      }

      const { scrollTop, scrollHeight } = historyElement
      await nextTick()
      historyElement.scrollTop = scrollTop + historyElement.scrollHeight - scrollHeight
    }
  }

  const renderLoader = (
    direction: 'around' | 'up' | 'down',
    startId: number,
    gap: History.Gap
  ) => {
    const lockStatus = loadConvoHistoryLock.get(`${props.convo.id}-${direction}`)
    const onLoad = () => loadHistory(direction, Message.resolveCmid(startId), gap)

    if (lockStatus === 'error') {
      return (
        <div class="ConvoHistory__loadError">
          {lang.use('me_convo_loading_error')}
          <Button onClick={onLoad}>
            {lang.use('me_convo_retry_loading')}
          </Button>
        </div>
      )
    }

    return (
      <IntersectionWrapper key={startId} onIntersect={onLoad}>
        <Spinner size="regular" class="ConvoHistory__spinner" />
      </IntersectionWrapper>
    )
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
          {renderLoader('around', matchedAroundId, gapAround)}
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
      <div class="ConvoHistory" ref={$historyElement}>
        <div class="ConvoHistory__content">
          <div class="ConvoHistory__topFiller" />

          {gapBefore && renderLoader('up', gapBefore.toId, gapBefore)}

          <HistoryMessages messages={messages} convo={props.convo} />

          {gapAfter && renderLoader('down', gapAfter.fromId, gapAfter)}

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
    )
  }
}, {
  props: ['convo']
})

type HistoryMessagesProps = {
  messages: Message.Message[]
  convo: Convo.Convo
}

type HistoryBlock =
  | { kind: 'Date', date: number }
  | { kind: 'Stack', stack: NonEmptyArray<Message.Message> }
  | { kind: 'Unread', inReadBy: number }

const HistoryMessages = defineComponent<HistoryMessagesProps>((props) => {
  const { lang } = useEnv()

  const blocks = computed(() => {
    return props.messages.reduce((blocks, message, index) => {
      const prevMessage = props.messages[index - 1]

      if (
        !message.isOut &&
        Message.isUnread(message, props.convo) &&
        (!prevMessage || !Message.isUnread(prevMessage, props.convo))
      ) {
        blocks.push({ kind: 'Unread', inReadBy: props.convo.inReadBy })
      }

      const prevBlock = blocks.at(-1)

      if (
        !prevBlock || !prevMessage ||
        !isSameDay(new Date(prevMessage.sentAt), new Date(message.sentAt))
      ) {
        blocks.push({ kind: 'Date', date: message.sentAt })
        blocks.push({ kind: 'Stack', stack: [message] })
        return blocks
      }

      if (
        prevBlock.kind !== 'Stack' ||
        prevMessage.kind !== message.kind ||
        prevMessage.authorId !== message.authorId
      ) {
        blocks.push({ kind: 'Stack', stack: [message] })
        return blocks
      }

      prevBlock.stack.push(message)
      return blocks
    }, new Array<HistoryBlock>())
  })

  return () => blocks.value.map((block) => {
    switch (block.kind) {
      case 'Stack': {
        const start = block.stack[0]
        const end = block.stack.at(-1)
        const startKey = start.kind === 'Pending' ? start.randomId : start.cmid
        const endKey = end?.kind === 'Pending' ? end.randomId : end?.cmid

        return <MessagesStack key={`stack-${startKey}-${endKey}`} messages={block.stack} />
      }

      case 'Date': {
        const blockDate = new Date(block.date)
        const nowDate = new Date()
        let date: string

        if (isSameDay(nowDate, blockDate)) {
          date = lang.use('date_today')
        } else if (isPreviousDay(nowDate, blockDate)) {
          date = lang.use('date_yesterday')
        } else {
          const isSameYear = nowDate.getFullYear() === blockDate.getFullYear()
          date = lang.dateTimeFormatter({
            day: 'numeric',
            month: 'long',
            year: isSameYear ? undefined : 'numeric'
          }).format(block.date)
        }

        return <div class="ConvoHistory__dateBlock" key={`date-${block.date}`}>{date}</div>
      }

      case 'Unread':
        return (
          <div class="ConvoHistory__unreadBlock" key={`unread-${block.inReadBy}`}>
            {lang.use('me_convo_unread_messages')}
          </div>
        )
    }
  })
}, {
  props: ['messages', 'convo']
})
