import { computed, defineComponent } from 'vue'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useEnv } from 'hooks'
import { exhaustivenessCheck, NonEmptyArray } from 'misc/utils'
import { ConvoMessage } from 'ui/messenger/ConvoMessage/ConvoMessage'
import { ExpiredMessage } from 'ui/messenger/ExpiredMessage/ExpiredMessage'
import { ServiceMessage } from 'ui/messenger/ServiceMessage/ServiceMessage'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ConvoHistory.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoHistory = defineComponent<Props>(({ convo }) => {
  const { lang } = useEnv()
  const historySlice = computed(() => History.around(convo.history, convo.inReadBy))

  return () => {
    const { messages, gapBefore, gapAround, gapAfter } = historySlice.value

    if (gapAround) {
      return (
        <div class="ConvoHistory ConvoHistory--placeholder">
          <IntersectionWrapper onIntersect={() => console.log('load from gapAround')}>
            <Spinner size="regular" class="ConvoHistory__spinner" />
          </IntersectionWrapper>
        </div>
      )
    }

    if (messages.length === 0) {
      return (
        <div class="ConvoHistory ConvoHistory--placeholder">
          {lang.use('me_convo_empty_placeholder')}
        </div>
      )
    }

    return (
      <div class="ConvoHistory">
        <div class="ConvoHistory__topFiller" />

        {gapBefore && (
          <IntersectionWrapper onIntersect={() => console.log('load from gapBefore')}>
            <Spinner size="regular" class="ConvoHistory__spinner" />
          </IntersectionWrapper>
        )}

        <HistoryMessages messages={messages} />

        {gapAfter && (
          <IntersectionWrapper onIntersect={() => console.log('load from gapAfter')}>
            <Spinner size="regular" class="ConvoHistory__spinner" />
          </IntersectionWrapper>
        )}
      </div>
    )
  }
}, {
  props: ['convo']
})

type HistoryMessagesProps = {
  messages: Message.Message[]
}

const HistoryMessages = defineComponent<HistoryMessagesProps>(({ messages }) => {
  return () => {
    const stacks = messages.reduce((stacks, message, index) => {
      const lastStack = stacks.at(-1)
      const prevMessage = messages[index - 1]

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
  props: ['messages']
})

type MessagesStackProps = {
  messages: NonEmptyArray<Message.Message>
}

const MessagesStack = defineComponent<MessagesStackProps>(({ messages }) => {
  const author = computed(() => Peer.safeGet(messages[0].authorId))

  const renderMessage = (message: Message.Message) => {
    switch (message.kind) {
      case 'Normal':
        return <ConvoMessage message={message} />
      case 'Service':
        return <ServiceMessage message={message} />
      case 'Expired':
        return <ExpiredMessage count={1} />
      default:
        return exhaustivenessCheck(message)
    }
  }

  return () => (
    <div class="MessagesStack">
      <Avatar class="MessagesStack__avatar" peer={author.value} size={32} />
      <div class="MessagesStack__messages">
        {messages.map(renderMessage)}
      </div>
    </div>
  )
}, {
  props: ['messages']
})
