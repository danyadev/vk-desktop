import { computed, defineComponent } from 'vue'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { loadConvoHistory } from 'actions'
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

  const loadHistory = (direction: 'around' | 'up' | 'down', startCmid: Message.Cmid, gap: History.Gap) => (
    loadConvoHistory({
      peerId: convo.id,
      startCmid,
      gap,
      direction
    })
  )

  return () => {
    const { items, gapBefore, gapAround, gapAfter } = historySlice.value

    if (gapAround) {
      return (
        <div class="ConvoHistory__placeholder">
          <IntersectionWrapper onIntersect={() => loadHistory('around', convo.inReadBy, gapAround)}>
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
      <div class="ConvoHistory">
        <div class="ConvoHistory__content">
          <div class="ConvoHistory__topFiller" />

          {gapBefore && (
            <IntersectionWrapper
              onIntersect={() => gapBefore && loadHistory('up', Message.resolveCmid(gapBefore.toId), gapBefore)}
            >
              <Spinner size="regular" class="ConvoHistory__spinner" />
            </IntersectionWrapper>
          )}

          <HistoryMessages items={items} />

          {gapAfter && (
            <IntersectionWrapper
              onIntersect={() => gapAfter && loadHistory('down', Message.resolveCmid(gapAfter.fromId), gapAfter)}
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

type MessagesStackProps = {
  messages: NonEmptyArray<Message.Message>
}

const MessagesStack = defineComponent<MessagesStackProps>((props) => {
  const author = computed(() => Peer.safeGet(props.messages[0].authorId))
  const isOut = computed(() => props.messages[0].isOut)

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
    <div class={['MessagesStack', isOut.value && 'MessagesStack--out']}>
      {!isOut.value && <Avatar class="MessagesStack__avatar" peer={author.value} size={32} />}
      <div class="MessagesStack__messages">
        {props.messages.map(renderMessage)}
      </div>
    </div>
  )
}, {
  props: ['messages']
})
