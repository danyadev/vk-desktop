import { computed, defineComponent } from 'vue'
import * as Peer from 'model/Peer'
import { TypingUser } from 'store/convos'
import { useEnv } from 'hooks'
import { NonEmptyArray } from 'misc/utils'
import './ConvoTyping.css'

type Props = {
  typingUsers: NonEmptyArray<TypingUser>
  namesLimit?: number
  short?: boolean
}

export const ConvoTyping = defineComponent<Props>((props) => {
  const { lang } = useEnv()

  const text = computed(() => {
    const { type } = props.typingUsers[0]
    const userNames = props.typingUsers
      .map(({ peerId }) => Peer.safeGet(peerId))
      .map((peer) => Peer.name(peer))
      .slice(0, props.namesLimit)

    if (userNames.length === 0) {
      return lang.usePlural(`me_convo_typing_${type}`, 1)
    }

    const restCount = props.typingUsers.length - userNames.length

    const piecesToJoin = restCount
      ? [...userNames, lang.use('me_convo_typing_rest_count', { count: restCount })]
      : userNames
    const joinedLastPair = piecesToJoin
      .slice(-2)
      .join(lang.use('me_convo_typing_last_name_separator'))
    piecesToJoin.splice(-2, 2, joinedLastPair)

    const joinedList = piecesToJoin.join(lang.use('me_convo_typing_names_separator'))

    if (props.short) {
      return joinedList
    }

    return (
      joinedList +
      ' ' +
      lang.usePlural(`me_convo_typing_${type}`, restCount || userNames.length)
    )
  })

  return () => {
    const type = ({
      text: 'text',
      voice: 'voice',
      photo: 'file',
      video: 'file',
      file: 'file',
      videomessage: 'voice'
    } as const)[props.typingUsers[0].type]

    return (
      <div class="ConvoTyping">
        <span class={['ConvoTyping__indicator', `ConvoTyping__indicator--${type}`]}>
          <div class="ConvoTyping__particle" />
        </span>

        <span class="ConvoTyping__text">{text.value}</span>
      </div>
    )
  }
}, {
  props: ['typingUsers', 'namesLimit', 'short']
})
