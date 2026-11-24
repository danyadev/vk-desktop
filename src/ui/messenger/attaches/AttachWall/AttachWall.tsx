import { defineComponent } from 'vue'
import { useServices } from 'services'
import * as Attach from 'model/Attach'
import * as Peer from 'model/Peer'
import { usePeersStore } from 'store/peers'
import { useFormatDate, useGlobalModal } from 'hooks'
import { Attaches } from 'ui/messenger/attaches/Attaches'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { Button } from 'ui/ui/Button/Button'
import { ButtonBase } from 'ui/ui/ButtonBase/ButtonBase'
import { ButtonText } from 'ui/ui/ButtonText/ButtonText'
import { Icon16Repost, Icon28DeleteOutline, Icon32DonutCircleFillYellow } from 'assets/icons'
import './AttachWall.css'

type Props = {
  wall: Attach.Wall
  isRepost?: boolean
}

export const AttachWall = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const { peers } = usePeersStore()
  const { peerInfoModal } = useGlobalModal()
  const formatDate = useFormatDate()

  return () => {
    const author = Peer.safeGet(peers, props.wall.authorId)
    const hasAttaches = Attach.kindsCount(props.wall.attaches) > 0
    const isEmpty =
      !props.wall.text &&
      !hasAttaches &&
      !props.wall.donutPlaceholder &&
      !props.wall.isDeleted &&
      !props.wall.repost
    const wallLink = `https://vk.com/wall${props.wall.ownerId}_${props.wall.id}`

    return (
      <div class="AttachWall">
        <div class="AttachWall__header">
          <Icon16Repost class="AttachWall__icon" color="var(--vkui--color_icon_secondary_alpha)" />
          <ButtonBase
            class="AttachWall__avatar"
            onClick={() => peerInfoModal.open({ peerId: author.id })}
            focusStyle="none"
            tabindex={-1}
          >
            <Avatar peer={author} size={32} />
          </ButtonBase>

          <ButtonText
            class="AttachWall__name"
            onClick={() => peerInfoModal.open({ peerId: author.id })}
            underlineOnFocus
          >
            {Peer.name(author)}
          </ButtonText>
          <ButtonText class="AttachWall__date" href={wallLink} underlineOnFocus>
            {formatDate(props.wall.createdAt)}
          </ButtonText>
        </div>

        {props.wall.text && !props.wall.isDeleted && (
          <span class="AttachWall__text">
            {props.wall.text}
          </span>
        )}
        {hasAttaches && (
          <Attaches class="AttachWall__attaches" attaches={props.wall.attaches} />
        )}

        {props.wall.donutPlaceholder && (
          <div class="AttachWall__placeholder">
            <Icon32DonutCircleFillYellow />
            {props.wall.donutPlaceholder}
          </div>
        )}

        {props.wall.isDeleted && (
          <div class="AttachWall__placeholder">
            <Icon28DeleteOutline color="var(--vkui--color_icon_secondary)" />
            {props.wall.text}
          </div>
        )}

        {isEmpty && (
          <span class="AttachWall__empty">
            {lang.use('me_attach_wall_empty')}
          </span>
        )}

        {props.wall.repost && (
          <AttachWall class="AttachWall__repost" wall={props.wall.repost} isRepost />
        )}

        {!props.isRepost && (
          <Button class="AttachWall__openButton" href={wallLink} size="small" mode="outline">
            {lang.use('me_attach_wall_open_button')}
          </Button>
        )}
      </div>
    )
  }
}, {
  props: ['wall', 'isRepost']
})
