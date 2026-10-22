import { computed, defineComponent, MouseEvent, onMounted, shallowRef } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { usePeersStore } from 'store/peers'
import { insertPeers } from 'actions'
import { PEER_FIELDS } from 'misc/constants'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuSubmenu } from 'ui/ui/ActionMenuSubmenu/ActionMenuSubmenu'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { AvatarStack } from 'ui/ui/AvatarStack/AvatarStack'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon20ViewOutline } from 'assets/icons'
import './MessageReadersMenuItem.css'

type Props = {
  convo: Convo.Convo
  message: Message.Normal
}

export const MessageReadersMenuItem = defineComponent<Props>((props) => {
  const { api, lang } = useServices()
  const { peers } = usePeersStore()
  const readers = shallowRef<Peer.OwnerId[]>([])
  const totalCount = shallowRef<number>()
  const isLoading = shallowRef(false)
  const isError = shallowRef(false)

  const hasMore = computed(() => (
    totalCount.value === undefined ||
    readers.value.length < totalCount.value
  ))
  const preview = computed(() => (
    readers.value.slice(0, 3).map((id) => Peer.safeGet(peers, id))
  ))

  const loadMore = async () => {
    if (isLoading.value || !hasMore.value) {
      return
    }

    isLoading.value = true
    isError.value = false

    try {
      const response = await api.fetch('messages.getMessageReadPeers', {
        peer_id: props.message.peerId,
        cmid: props.message.cmid,
        offset_major_id: readers.value.length,
        count: totalCount.value === undefined ? 3 : 50,
        extended: 1,
        fields: PEER_FIELDS
      })

      insertPeers({ profiles: response.profiles, groups: response.groups })
      totalCount.value = response.total_count
      readers.value = [...readers.value, ...response.items.map(Peer.resolveOwnerId)]
    } catch (error) {
      console.error('[MessageReadersMenuItem] Failed to load readers', error)
      isError.value = true
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    loadMore()
  })

  return () => {
    const count = totalCount.value ?? 0
    const text = isError.value && totalCount.value === undefined
      ? lang.use('me_message_menu_readers_error')
      : totalCount.value === undefined
        ? lang.use('me_message_menu_readers_loading')
        : lang.usePlural('me_message_menu_readers_count', count, { count })

    const onClick = (event: MouseEvent) => {
      event.stopImmediatePropagation()
      if (isError.value && totalCount.value === undefined) {
        loadMore()
      }
    }

    return (
      <ActionMenuSubmenu
        icon={<Icon20ViewOutline />}
        text={text}
        after={count > 0 && (
          <AvatarStack
            class="MessageReadersMenuItem_avatarStack"
            peers={preview.value}
            size={24}
          />
        )}
        disabledMenu={count === 0 && !isError.value}
        hoverOpenDelay={150}
        onClickCapture={onClick}
      >
        <ActionMenu>
          <div class="MessageReadersMenuItem__list" onClick={(event) => event.stopPropagation()}>
            {readers.value.map((id) => {
              const peer = Peer.safeGet(peers, id)
              return (
                <div class="MessageReadersMenuItem__reader" key={id}>
                  <Avatar peer={peer} size={24} />
                  <span class="MessageReadersMenuItem__name">{Peer.name(peer)}</span>
                </div>
              )
            })}

            {isError.value ? (
              <LoadError onRetry={loadMore} />
            ) : hasMore.value ? (
              <IntersectionWrapper key={readers.value.length} onIntersect={loadMore}>
                <div class="MessageReadersMenuItem__loader">
                  <Spinner />
                </div>
              </IntersectionWrapper>
            ) : null}
          </div>
        </ActionMenu>
      </ActionMenuSubmenu>
    )
  }
}, {
  props: ['convo', 'message']
})
