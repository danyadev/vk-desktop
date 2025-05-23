import { computed, defineComponent } from 'vue'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import { useEnv } from 'hooks'
import { NonEmptyArray, RawRefElement } from 'misc/utils'
import { isPreviousDay, isSameDay } from 'misc/dateTime'
import { MessagesStack } from 'ui/messenger/MessagesStack/MessagesStack'

type HistoryMessagesProps = {
  messages: Message.Message[]
  messageElements: Map<Message.Cmid | 'unread', HTMLElement>
  convo: Convo.Convo
}

type HistoryBlock =
  | { kind: 'Date', date: number }
  | { kind: 'Stack', stack: NonEmptyArray<Message.Message> }
  | { kind: 'Unread', inReadBy: Message.Cmid }

export const HistoryMessages = defineComponent<HistoryMessagesProps>((props) => {
  const { lang } = useEnv()

  const setMessageRef = (cmid: Message.Cmid | 'unread', element: RawRefElement) => {
    if (element instanceof HTMLElement) {
      props.messageElements.set(cmid, element)
    } else {
      props.messageElements.delete(cmid)
    }
  }

  const blocks = computed(() => {
    return props.messages.reduce((blocks, message, index) => {
      const prevMessage = props.messages[index - 1]

      if (
        !message.isOut &&
        props.convo.inReadBy &&
        Message.isUnread(message, props.convo) &&
        (!prevMessage || !Message.isUnread(prevMessage, props.convo))
      ) {
        blocks.push({ kind: 'Unread', inReadBy: props.convo.inReadBy })
      }

      const prevBlock = blocks.at(-1)

      if (
        !prevBlock ||
        !prevMessage ||
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
      case 'Stack':
        // Не указываем key, чтобы vue сам определял, какие стеки нужно создать, а какие обновить.
        // Нет способа выразить key так, чтобы он не менялся при изменении того же стека(
        return <MessagesStack messages={block.stack} setMessageRef={setMessageRef} />

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
          <div
            class="ConvoHistory__unreadBlock"
            key={`unread-${block.inReadBy}`}
            ref={(el) => setMessageRef('unread', el)}
          >
            {lang.use('me_convo_unread_messages')}
          </div>
        )
    }
  })
}, {
  props: ['messages', 'messageElements', 'convo']
})
