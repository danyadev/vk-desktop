import { computed, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { useEnv, useFormatDate } from 'hooks'
import { exhaustivenessCheck } from 'misc/utils'
import { shortenCount } from 'misc/dateTime'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon24ChevronCompactLeft } from 'assets/icons'
import './ConvoHeader.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoHeader = defineComponent<Props>(({ convo }) => {
  const { lang } = useEnv()
  const router = useRouter()
  const peer = Peer.safeGet(convo.id)

  const formatDate = useFormatDate()

  const peerInfo = computed<string>(() => {
    switch (peer.kind) {
      case 'User': {
        if (peer.onlineInfo.isOnline) {
          return lang.use('me_user_online')
        }

        // TODO: поддержать onlineInfo.status
        if (!peer.onlineInfo.lastSeen) {
          return lang.use('me_user_was_online_a_long_time_ago')
        }

        return formatDate(peer.onlineInfo.lastSeen)
      }

      case 'Group': {
        return lang.usePlural('me_group_members_count', peer.membersCount, {
          count: shortenCount(peer.membersCount)
        })
      }

      case 'Chat': {
        return lang.usePlural('me_chat_members_count', peer.membersCount, {
          count: shortenCount(peer.membersCount)
        })
      }

      default: {
        return exhaustivenessCheck(peer)
      }
    }
  })

  return () => (
    <div class="ConvoHeader">
      <ButtonIcon
        icon={<Icon24ChevronCompactLeft color="var(--vkui--color_icon_secondary)" />}
        class="ConvoHeader__back"
        onClick={() => router.back()}
      />
      <Avatar class="ConvoHeader__avatar" peer={peer} size={32} />

      <span class="ConvoHeader__name">{Peer.name(peer)}</span>
      <span class="ConvoHeader__info">{peerInfo.value}</span>
    </div>
  )
}, {
  props: ['convo']
})
