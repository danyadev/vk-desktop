import { defineComponent } from 'vue'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { logout } from 'store/viewer'
import { loadMoreConvos } from 'actions'
import { useEnv, useFloating, useViewer } from 'hooks'
import { ClassName } from 'misc/utils'
import { ConvoListItem } from 'ui/messenger/ConvoListItem/ConvoListItem'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { Button } from 'ui/ui/Button/Button'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Floating } from 'ui/ui/Floating/Floating'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { ActionMenu } from 'ui/ui/menu/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/menu/ActionMenuItem/ActionMenuItem'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon24DoorArrowRightOutline, Icon24MoreHorizontal, Icon28SettingsOutline } from 'assets/icons'
import './ConvoList.css'

import { flip, offset, shift } from '@floating-ui/dom'

type Props = {
  class?: ClassName
  compact?: boolean
}

export const ConvoList = defineComponent<Props>((props) => {
  const { refs } = useFloating({
    placement: 'bottom-start',
    middleware: [
      offset(({ rects }) => ({
        alignmentAxis: -rects.floating.width
      })),
      shift(),
      flip()
    ]
  }, 'var(--vkui--color_transparent--hover)')

  const { lang } = useEnv()
  const viewer = useViewer()
  const { convoList, connection } = useConvosStore()

  return () => (
    <div class={['ConvoList', { 'ConvoList--compact': props.compact }]}>
      <div class="ConvoList__header">
        <Avatar class="ConvoList__headerAvatar" peer={viewer} size={32} />

        {!props.compact && (
          <>
            <span class="ConvoList__headerName">{Peer.name(viewer)}</span>
            <span class="ConvoList__headerStatus">{connection.status}</span>

            <Floating
              setFloating={refs.setFloating}
              setReference={refs.setReference}
              button={
                <ButtonIcon
                  class="ConvoList__burgerMenu"
                  addHoverBackground={false}
                  icon={
                    <Icon24MoreHorizontal color="var(--vkui--color_icon_secondary)" />
                  }
                />
              }
            >
              <ActionMenu
                actions={[
                  <ActionMenuItem
                    text="Настройки"
                    icon={
                      <Icon28SettingsOutline
                        width="20"
                        color="var(--vkui--color_icon_secondary)"
                      />
                    }
                  />,
                  <ActionMenuItem
                    text="Выход"
                    onClick={logout}
                    icon={
                      <Icon24DoorArrowRightOutline
                        width="20"
                        color="var(--vkui--color_icon_negative)"
                      />
                    }
                  />
                ]}
              />
            </Floating>
          </>
        )}
      </div>

      <div class="ConvoList__list">
        {convoList.peerIds.map((id) => (
          <ConvoListItem key={id} convo={Convo.safeGet(id)} compact={props.compact} />
        ))}

        {convoList.peerIds.length === 0 && !convoList.hasMore && (
          <div class="ConvoList__empty">
            {lang.use('me_convo_list_empty')}
          </div>
        )}

        {convoList.loadError && (
          <div class="ConvoList__error">
            {lang.use('me_convo_list_loading_error')}
            <Button onClick={loadMoreConvos}>
              {lang.use('me_convo_list_retry_loading')}
            </Button>
          </div>
        )}

        {convoList.hasMore && !convoList.loadError && (
          <IntersectionWrapper onIntersect={loadMoreConvos} key={convoList.peerIds.length}>
            <Spinner size="regular" class="ConvoList__spinner" />
          </IntersectionWrapper>
        )}
      </div>
    </div>
  )
}, {
  props: ['compact']
})
