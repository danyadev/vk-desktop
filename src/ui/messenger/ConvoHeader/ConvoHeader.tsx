import { computed, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { useEnv, useFormatDate } from 'hooks'
import { exhaustivenessCheck } from 'misc/utils'
import { shortenCount } from 'misc/dateTime'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon16Muted, Icon24ChevronCompactLeft } from 'assets/icons'
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
    const isChannel = Convo.isChannel(convo)

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
        const langKey = isChannel ? 'me_group_members_count' : 'me_chat_members_count'
        return lang.usePlural(langKey, peer.membersCount, {
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

      <div class="ConvoHeader__name">
        <span class="ConvoHeader__nameText">
          {Peer.name(peer)}
        </span>
        <span class="ConvoHeader__nameIcons">
          {!convo.notifications.enabled && (
            <Icon16Muted color="var(--vkui--color_icon_tertiary)" />
          )}
        </span>
      </div>
      <span class="ConvoHeader__info">{peerInfo.value}</span>
    </div>
  )
}, {
  props: ['convo']
})
