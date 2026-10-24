import { computed, defineComponent, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useServices } from 'services'
import * as Peer from 'model/Peer'
import { usePeersStore } from 'store/peers'
import { insertPeers } from 'actions'
import { useFormatOnlineStatus, useGlobalModal } from 'hooks'
import { normalizeUrl } from 'misc/utils'
import { PEER_GROUP_EXTRA_FIELDS, PEER_USER_EXTRA_FIELDS } from 'misc/constants'
import { shortenCount } from 'misc/dateTime'
import { PeerInfoCell } from './PeerInfoCell'
import { ModalView } from 'ui/modals/parts'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { Button } from 'ui/ui/Button/Button'
import { ButtonBase } from 'ui/ui/ButtonBase/ButtonBase'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Link } from 'ui/ui/Link/Link'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import {
  Icon20ArticleOutline,
  Icon20CakeOutline,
  Icon20CommunityName,
  Icon20DocumentTextOutline,
  Icon20EducationOutline,
  Icon20GlobeOutline,
  Icon20HashtagOutline,
  Icon20LockOutline,
  Icon20MentionOutline,
  Icon20PhoneOutline,
  Icon20PlaceOutline,
  Icon20UsersOutline,
  Icon20WorkOutline,
  Icon24Cancel
} from 'assets/icons'
import './PeerInfoModal.css'

export type PeerInfoModalProps = {
  peerId: Peer.UserId | Peer.GroupId
}

export const PeerInfoModal = defineComponent<PeerInfoModalProps>((props) => {
  const { api, lang } = useServices()
  const router = useRouter()
  const { peers } = usePeersStore()
  const { peerInfoModal, photoViewerModal } = useGlobalModal()
  const formatOnlineStatus = useFormatOnlineStatus()

  const $modal = shallowRef<HTMLElement | null>(null)
  const $header = shallowRef<HTMLElement | null>(null)
  const $hero = shallowRef<HTMLElement | null>(null)
  const isCompactHeader = shallowRef(false)
  const loading = shallowRef(true)
  const failed = shallowRef(false)

  const peer = computed(() => Peer.safeGet(peers, props.peerId))
  const user = computed(() => (
    peer.value.kind === 'User' ? peer.value : undefined
  ))
  const group = computed(() => (
    peer.value.kind === 'Group' ? peer.value : undefined
  ))

  const screenName = computed(() => (
    peer.value.screenName ||
    `${peer.value.kind === 'User' ? 'id' : 'club'}${Peer.toRealId(props.peerId)}`
  ))

  const profileUrl = computed(() => `https://vk.com/${screenName.value}`)

  const subtitle = computed(() => {
    const currentGroup = group.value

    if (currentGroup) {
      const count = currentGroup.membersCount

      return count
        ? lang.usePlural('me_group_members_count', count, {
            count: shortenCount(count)
          })
        : lang.use('peerInfo_community')
    }

    const currentUser = user.value
    if (!currentUser) return ''

    if (currentUser.deactivated) {
      return currentUser.deactivated === 'deleted'
        ? lang.use('peerInfo_deleted')
        : lang.use('peerInfo_banned')
    }

    return formatOnlineStatus(currentUser)
  })

  const load = async () => {
    const { peerId } = props
    loading.value = true
    failed.value = false

    try {
      if (Peer.isUserPeerId(peerId)) {
        const [apiUser] = await api.fetch('users.get', {
          user_ids: peerId,
          fields: PEER_USER_EXTRA_FIELDS
        })

        if (!apiUser) throw new Error('User not found')
        insertPeers({ profiles: [apiUser], withExtraFields: true })
      } else {
        const { groups: [apiGroup] } = await api.fetch('groups.getById', {
          group_ids: Peer.toRealId(peerId),
          fields: PEER_GROUP_EXTRA_FIELDS
        })

        if (!apiGroup) throw new Error('Group not found')
        insertPeers({ groups: [apiGroup], withExtraFields: true })
      }
    } catch (error) {
      if (props.peerId === peerId) {
        console.error('[PeerInfoModal] Failed to load profile', error)
        failed.value = true
      }
    } finally {
      if (props.peerId === peerId) {
        loading.value = false
      }
    }
  }

  const onScroll = () => {
    if ($modal.value && $header.value && $hero.value) {
      isCompactHeader.value =
        $modal.value.scrollTop >= $hero.value.offsetHeight - $header.value.offsetHeight
    }
  }

  watch(() => props.peerId, () => {
    $modal.value?.scrollTo({ top: 0 })
    load()
  }, { immediate: true })

  const openConversation = () => {
    peerInfoModal.close()

    const route = router.currentRoute.value
    if (route.name === 'Convo' && Number(route.params.peerId) === props.peerId) {
      return
    }

    router.push({
      name: 'Convo',
      params: { peerId: props.peerId },
      query: { canGoBack: 1 }
    })
  }

  const formatBirthday = (birthday: string) => {
    const [day, month, year] = birthday.split('.').map(Number)

    if (!day || day > 31 || !month || month > 12) {
      return birthday
    }

    return lang.dateTimeFormatter({
      day: 'numeric',
      month: 'long',
      year: year ? 'numeric' : undefined
    }).format(new Date(year ?? 2000, month - 1, day))
  }

  return () => {
    const currentUser = user.value
    const currentGroup = group.value
    const currentPeer = currentUser ?? currentGroup

    const screenNameValue = screenName.value
    const location = [currentPeer?.city, currentPeer?.country].filter(Boolean).join(', ')
    const career = currentUser?.career?.find((item) => !item.until)
    const work = [career?.company, career?.position].filter(Boolean).join(' · ')
    const lastUniversity = currentUser?.universities?.at(-1)

    return (
      <ModalView
        opened={peerInfoModal.opened}
        onClose={peerInfoModal.close}
        onVisibilityChange={peerInfoModal.onVisibilityChange}
      >
        <div class="PeerInfoModal" ref={$modal} onScroll={onScroll}>
          <div
            ref={$header}
            class={['PeerInfoModal__header', {
              'PeerInfoModal__header--compact': isCompactHeader.value
            }]}
          >
            <div class="PeerInfoModal__headerPeer">
              <Avatar peer={peer.value} size={32} />
              <span class="PeerInfoModal__headerName">{Peer.name(peer.value)}</span>
            </div>

            <ButtonIcon
              class="PeerInfoModal__headerClose"
              icon={<Icon24Cancel />}
              withHoverBackground
              onClick={peerInfoModal.close}
            />
          </div>

          <div class="PeerInfoModal__hero" ref={$hero}>
            {loading.value && (
              <Spinner class="PeerInfoModal__loading" size="regular" />
            )}

            <ButtonBase
              class="PeerInfoModal__avatar"
              disabled={!currentPeer?.photoOriginal}
              onClick={() => {
                if (currentPeer?.photoOriginal) {
                  photoViewerModal.open({ url: currentPeer.photoOriginal })
                }
              }}
            >
              <Avatar peer={peer.value} size={80} />
            </ButtonBase>

            <h2 class="PeerInfoModal__name">
              {Peer.name(peer.value)}
            </h2>

            <div class="PeerInfoModal__subtitle">
              {subtitle.value}
            </div>
          </div>

          <div class="PeerInfoModal__actions">
            <Button size="large" wide onClick={openConversation}>
              {lang.use('peerInfo_message')}
            </Button>

            <Button size="large" mode="secondary" wide href={profileUrl.value}>
              {lang.use('peerInfo_open_in_vk')}
            </Button>
          </div>

          <div class="PeerInfoModal__details">
            {failed.value && <LoadError onRetry={load} />}

            <PeerInfoCell icon={<Icon20MentionOutline />}>
              @{screenNameValue}
            </PeerInfoCell>

            {currentPeer?.phone && (
              <PeerInfoCell icon={<Icon20PhoneOutline />}>
                {currentPeer.phone}
              </PeerInfoCell>
            )}

            {currentPeer?.status && (
              <PeerInfoCell icon={<Icon20ArticleOutline />}>
                {currentPeer.status}
              </PeerInfoCell>
            )}

            {currentUser?.birthDate && (
              <PeerInfoCell icon={<Icon20CakeOutline />}>
                {formatBirthday(currentUser.birthDate)}
              </PeerInfoCell>
            )}

            {location && (
              <PeerInfoCell icon={<Icon20PlaceOutline />}>
                {location}
              </PeerInfoCell>
            )}

            {work && (
              <PeerInfoCell icon={<Icon20WorkOutline />}>
                {work}
              </PeerInfoCell>
            )}

            {lastUniversity && (
              <PeerInfoCell icon={<Icon20EducationOutline />}>
                {lastUniversity}
              </PeerInfoCell>
            )}

            {!!currentUser?.followersCount && (
              <PeerInfoCell icon={<Icon20UsersOutline />}>
                {lang.usePlural('me_group_members_count', currentUser.followersCount, {
                  count: currentUser.followersCount
                })}
              </PeerInfoCell>
            )}

            {currentUser?.isClosed && !currentUser.canAccessClosed && (
              <PeerInfoCell icon={<Icon20LockOutline />}>
                {lang.use('peerInfo_private')}
              </PeerInfoCell>
            )}

            {currentGroup?.activity && (
              <PeerInfoCell icon={<Icon20CommunityName />}>
                {currentGroup.activity}
              </PeerInfoCell>
            )}

            {currentGroup?.description && (
              <PeerInfoCell icon={<Icon20DocumentTextOutline />}>
                {currentGroup.description}
              </PeerInfoCell>
            )}

            {currentPeer?.site && (
              <PeerInfoCell icon={<Icon20GlobeOutline />}>
                <Link href={normalizeUrl(currentPeer.site)}>
                  {currentPeer.site}
                </Link>
              </PeerInfoCell>
            )}

            <PeerInfoCell icon={<Icon20HashtagOutline />}>
              {Peer.toRealId(props.peerId)}
            </PeerInfoCell>
          </div>
        </div>
      </ModalView>
    )
  }
}, {
  props: ['peerId']
})
