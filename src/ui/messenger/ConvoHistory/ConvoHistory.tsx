import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import { useConvosStore } from 'store/convos'
import { loadConvoHistory } from 'actions'
import { useEnv } from 'hooks'
import { NonEmptyArray } from 'misc/utils'
import { MessagesStack } from 'ui/messenger/MessagesStack/MessagesStack'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ConvoHistory.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoHistory = defineComponent<Props>(({ convo }) => {
  const { lang } = useEnv()
  const { savedConvoScroll } = useConvosStore()
  const historySlice = computed(() => History.around(convo.history, convo.inReadBy))
  const $historyElement = shallowRef<HTMLDivElement | null>(null)

  onMounted(() => {
    const scrollTop = savedConvoScroll.get(convo.id)
    if ($historyElement.value && scrollTop !== undefined) {
      $historyElement.value.scrollTop = scrollTop
    }
  })

  onBeforeUnmount(() => {
    if ($historyElement.value) {
      savedConvoScroll.set(convo.id, $historyElement.value.scrollTop)
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
        const aroundMessage = insertedMessages.find(({ cmid }) => (cmid >= startCmid))
          ?? insertedMessages.at(-1)

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

  return () => {
    const { items, matchedAroundId, gapBefore, gapAround, gapAfter } = historySlice.value

    if (gapAround) {
      return (
        <div class="ConvoHistory__placeholder">
          <IntersectionWrapper
            key={matchedAroundId}
            onIntersect={() => {
              loadHistory('around', Message.resolveCmid(matchedAroundId), gapAround)
            }}
          >
            <Spinner size="regular" class="ConvoHistory__spinner" />
          </IntersectionWrapper>
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

    return (
      <div class="ConvoHistory" ref={$historyElement}>
        <div class="ConvoHistory__content">
          <div class="ConvoHistory__topFiller" />

          {gapBefore && (
            <IntersectionWrapper
              key={gapBefore.toId}
              onIntersect={() => {
                loadHistory('up', Message.resolveCmid(gapBefore.toId), gapBefore)
              }}
            >
              <Spinner size="regular" class="ConvoHistory__spinner" />
            </IntersectionWrapper>
          )}

          <HistoryMessages items={items} />

          {gapAfter && (
            <IntersectionWrapper
              key={gapAfter.fromId}
              onIntersect={() => {
                loadHistory('down', Message.resolveCmid(gapAfter.fromId), gapAfter)
              }}
            >
              <Spinner size="regular" class="ConvoHistory__spinner" />
            </IntersectionWrapper>
          )}
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
