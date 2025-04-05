import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  provide,
  shallowRef
} from 'vue'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import { useConvosStore } from 'store/convos'
import { loadConvoHistory } from 'actions'
import { useEnv, useResizeObserver } from 'hooks'
import { isNonEmptyArray, NonEmptyArray } from 'misc/utils'
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

export const ConvoHistory = defineComponent<Props>(({ convo }) => {
  const { lang } = useEnv()
  const { loadConvoHistoryLock, savedConvoScroll, typings } = useConvosStore()
  const historySlice = computed(() => History.around(convo.history, convo.inReadBy))
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

  onMounted(() => {
    if (!$historyElement.value) {
      return
    }

    const scrollTop = savedConvoScroll.get(convo.id)
    if ($historyElement.value && scrollTop !== undefined) {
      $historyElement.value.scrollTop = scrollTop
    }

    historyWidth.value = $historyElement.value.offsetWidth
    historyHeight.value = $historyElement.value.offsetHeight
  })

  onBeforeUnmount(() => {
    if ($historyElement.value) {
      savedConvoScroll.set(convo.id, $historyElement.value.scrollTop)
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
      peerId: convo.id,
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

  const correctScrollPosition = (
    insertedMessages: Message.Message[],
    direction: 'around' | 'up' | 'down',
    startCmid: Message.Cmid
  ) => {
    if (direction === 'around') {
      nextTick(() => {
        const historyElement = $historyElement.value
        if (!historyElement) {
          return
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
      })
    }

    if (direction === 'up') {
      const historyElement = $historyElement.value
      if (!historyElement) {
        return
      }

      const { scrollTop, scrollHeight } = historyElement
      nextTick(() => {
        historyElement.scrollTop = scrollTop + historyElement.scrollHeight - scrollHeight
      })
    }
  }

  const renderLoader = (
    direction: 'around' | 'up' | 'down',
    startId: number,
    gap: History.Gap
  ) => {
    const lockStatus = loadConvoHistoryLock.get(`${convo.id}-${direction}`)
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

    if (gapAround) {
      return (
        <div class="ConvoHistory__placeholder">
          {renderLoader('around', matchedAroundId, gapAround)}
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div class="ConvoHistory__placeholder">
          {lang.use('me_convo_empty_placeholder')}
        </div>
      )
    }

    const typingUsers = typings.get(convo.id)

    return (
      <div class="ConvoHistory" ref={$historyElement}>
        <div class="ConvoHistory__content">
          <div class="ConvoHistory__topFiller" />

          {gapBefore && renderLoader('up', gapBefore.toId, gapBefore)}

          <HistoryMessages items={items} />

          {gapAfter && renderLoader('down', gapAfter.fromId, gapAfter)}

          <div class="ConvoHistory__footer">
            {!gapAfter && typingUsers && isNonEmptyArray(typingUsers) && (
              <ConvoTyping
                typingUsers={typingUsers}
                namesLimit={
                  convo.kind === 'UserConvo' || convo.kind === 'GroupConvo' ? 0 : undefined
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
  items: Array<History.Item<Message.Message>>
}

const HistoryMessages = defineComponent<HistoryMessagesProps>((props) => {
  return () => {
    const stacks = props.items.reduce((stacks, item, index) => {
      const lastStack = stacks.at(-1)
      const prevItem = props.items[index - 1]

      const message = item.item
      const prevMessage = prevItem?.item

      if (
        !lastStack ||
        !prevMessage ||
        prevMessage.kind !== message.kind ||
        prevMessage.authorId !== message.authorId
      ) {
        stacks.push([message])
      } else {
        lastStack.push(message)
      }

      return stacks
    }, new Array<NonEmptyArray<Message.Message>>())

    return stacks.map((messages) => <MessagesStack messages={messages} />)
  }
}, {
  props: ['items']
})
