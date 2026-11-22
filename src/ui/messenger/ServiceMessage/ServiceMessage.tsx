import { defineComponent } from 'vue'
import { useServices } from 'services'
import * as ILang from 'services/contracts/ILang'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { usePeersStore } from 'store/peers'
import { useConvoSession, useGlobalModal, useViewer } from 'hooks'
import { ButtonText } from 'ui/ui/ButtonText/ButtonText'
import './ServiceMessage.css'

type Props = {
  message: Message.Service
}

export const ServiceMessage = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const viewer = useViewer()
  const { peers } = usePeersStore()
  const session = useConvoSession()
  const { peerInfoModal, photoViewerModal } = useGlobalModal()

  const renderMessage = () => {
    const { message } = props
    const { action } = message
    const author = Peer.safeGet(peers, message.authorId)
    const gender = author.kind === 'User'
      ? author.id === viewer.id ? 'you' : author.gender
      : 'unknown'

    const peerName = (peer: Peer.User | Peer.Group, nameCase?: 'acc') => (
      <ButtonText
        class="ServiceMessage__link"
        onClick={() => peerInfoModal.open({ peerId: peer.id })}
      >
        {Peer.name(peer, nameCase)}
      </ButtonText>
    )

    const targetName = (target: Peer.User | Peer.Group) => (
      target.id === viewer.id
        ? lang.use('me_service_target_you_acc')
        : peerName(target, 'acc')
    )

    const authorName = peerName(author)

    switch (action.type) {
      case 'chat_create':
        return lang.useGenderJSX('me_service_chat_create', gender, {
          author: authorName,
          title: action.title
        })

      case 'chat_title_update':
        return lang.useGenderJSX('me_service_chat_title_update', gender, {
          author: authorName,
          oldTitle: action.oldTitle,
          title: action.title
        })

      case 'chat_photo_update':
      case 'chat_photo_remove':
      case 'chat_invite_user_by_link':
      case 'chat_screenshot':
      case 'chat_group_call_started':
      case 'chat_invite_user_by_call_join_link':
        return lang.useGenderJSX(`me_service_${action.type}`, gender, {
          author: authorName
        })

      case 'chat_kick_don':
        return lang.use('me_service_chat_kick_don')

      case 'call_transcription_failed':
        return lang.use('me_service_call_transcription_failed')

      case 'chat_invite_user':
      case 'chat_kick_user': {
        if (message.authorId === action.peerId) {
          return lang.useGenderJSX(`me_service_${action.type}_self`, gender, {
            author: authorName
          })
        }

        const target = Peer.safeGet(peers, action.peerId)
        return lang.useGenderJSX(`me_service_${action.type}`, gender, {
          author: authorName,
          target: targetName(target)
        })
      }

      case 'chat_invite_user_by_message_request':
      case 'chat_invite_user_by_call': {
        const target = Peer.safeGet(peers, action.peerId)
        return lang.useGenderJSX(`me_service_${action.type}`, gender, {
          author: authorName,
          target: targetName(target)
        })
      }

      case 'accepted_message_request': {
        const target = Peer.safeGet(peers, action.peerId)
        return lang.useJSX('me_service_accepted_message_request', {
          target: peerName(target)
        })
      }

      case 'chat_kick_user_call_block': {
        const target = Peer.safeGet(peers, action.peerId)
        const targetGender = target.kind === 'User'
          ? target.id === viewer.id ? 'you' : target.gender
          : 'unknown'

        return lang.useGenderJSX('me_service_chat_kick_user_call_block', targetGender, {
          target: peerName(target)
        })
      }

      case 'chat_pin_message':
      case 'chat_unpin_message':
        return lang.useGenderJSX(`me_service_${action.type}`, gender, {
          author: authorName,
          // Deliberately use span instead of <button> because it can't wrap text at all
          message: (
            <span
              class="ServiceMessage__link"
              onClick={() => (session.navigationRequest = { kind: 'Message', cmid: action.cmid })}
            >
              {action.message || lang.usePlural('me_messages_preview', 1)}
            </span>
          )
        })

      case 'conversation_style_update':
      case 'conversation_style_update_action':
        if (action.style) {
          const styleTranslations = lang.useRaw('me_convo_styles')
          return lang.useGenderJSX('me_service_conversation_style_update', gender, {
            author: authorName,
            style: styleTranslations[action.style]
          })
        }

        return lang.useGenderJSX('me_service_conversation_style_reset', gender, {
          author: authorName
        })

      case 'chat_owner_changed': {
        const target = Peer.safeGet(peers, action.peerId)
        return lang.useGenderJSX('me_service_chat_owner_changed', gender, {
          author: authorName,
          target: targetName(target)
        })
      }

      case 'chat_without_owner_all':
        return lang.useGenderJSX('me_service_chat_without_owner_all', gender, {
          author: authorName
        })

      case 'custom':
        return action.message

      case 'unknown':
        return lang.use('me_unsupported_service_message')
    }
  }

  return () => {
    const photoUpdateAction = props.message.action.type === 'chat_photo_update'
      ? props.message.action
      : undefined

    return (
      <div class="ServiceMessage">
        <div class="ServiceMessage__text">
          {renderMessage()}
        </div>

        {photoUpdateAction?.photo && (
          <img
            class="ServiceMessage__photo"
            src={
              photoUpdateAction.photo.sizes.get('p')?.url ??
              photoUpdateAction.photo.sizes.get('x')?.url ??
              photoUpdateAction.photo.image.url
            }
            onClick={() => {
              if (photoUpdateAction.photo) {
                photoViewerModal.open({ url: photoUpdateAction.photo.image.url })
              }
            }}
          />
        )}
      </div>
    )
  }
}, {
  props: ['message']
})

export function getServiceMessageText(
  message: Message.Service,
  lang: ILang.Lang,
  peers: Map<Peer.Id, Peer.Peer>,
  viewerId: Peer.UserId
): string {
  const author = Peer.safeGet(peers, message.authorId)
  const gender = author.kind === 'User'
    ? author.id === viewerId ? 'you' : author.gender
    : 'unknown'

  const targetName = (target: Peer.Peer) => (
    target.id === viewerId
      ? lang.use('me_service_target_you_acc')
      : Peer.name(target, 'acc')
  )

  switch (message.action.type) {
    case 'chat_create':
      return lang.useGender('me_service_chat_create', gender, {
        author: Peer.name(author),
        title: message.action.title
      })

    case 'chat_title_update':
      return lang.useGender('me_service_chat_title_update', gender, {
        author: Peer.name(author),
        oldTitle: message.action.oldTitle,
        title: message.action.title
      })

    case 'chat_photo_update':
    case 'chat_photo_remove':
    case 'chat_invite_user_by_link':
    case 'chat_screenshot':
    case 'chat_group_call_started':
    case 'chat_invite_user_by_call_join_link':
      return lang.useGender(`me_service_${message.action.type}`, gender, {
        author: Peer.name(author)
      })

    case 'chat_kick_don':
      return lang.use('me_service_chat_kick_don')

    case 'call_transcription_failed':
      return lang.use('me_service_call_transcription_failed')

    case 'chat_invite_user':
    case 'chat_kick_user': {
      if (message.authorId === message.action.peerId) {
        return lang.useGender(`me_service_${message.action.type}_self`, gender, {
          author: Peer.name(author)
        })
      }

      const target = Peer.safeGet(peers, message.action.peerId)
      return lang.useGender(`me_service_${message.action.type}`, gender, {
        author: Peer.name(author),
        target: targetName(target)
      })
    }

    case 'chat_invite_user_by_message_request':
    case 'chat_invite_user_by_call': {
      const target = Peer.safeGet(peers, message.action.peerId)
      return lang.useGender(`me_service_${message.action.type}`, gender, {
        author: Peer.name(author),
        target: targetName(target)
      })
    }

    case 'accepted_message_request': {
      const target = Peer.safeGet(peers, message.action.peerId)
      return lang.use('me_service_accepted_message_request', {
        target: Peer.name(target)
      })
    }

    case 'chat_kick_user_call_block': {
      const target = Peer.safeGet(peers, message.action.peerId)
      const targetGender = target.kind === 'User'
        ? target.id === viewerId ? 'you' : target.gender
        : 'unknown'

      return lang.useGender('me_service_chat_kick_user_call_block', targetGender, {
        target: Peer.name(target)
      })
    }

    case 'chat_pin_message':
    case 'chat_unpin_message':
      return lang.useGender(`me_service_${message.action.type}`, gender, {
        author: Peer.name(author),
        message: message.action.message || lang.usePlural('me_messages_preview', 1)
      })

    case 'conversation_style_update':
    case 'conversation_style_update_action':
      if (message.action.style) {
        const styleTranslations = lang.useRaw('me_convo_styles')
        return lang.useGender('me_service_conversation_style_update', gender, {
          author: Peer.name(author),
          style: styleTranslations[message.action.style]
        })
      } else {
        return lang.useGender('me_service_conversation_style_reset', gender, {
          author: Peer.name(author)
        })
      }

    case 'chat_owner_changed': {
      const target = Peer.safeGet(peers, message.action.peerId)
      return lang.useGender('me_service_chat_owner_changed', gender, {
        author: Peer.name(author),
        target: targetName(target)
      })
    }

    case 'chat_without_owner_all':
      return lang.useGender('me_service_chat_without_owner_all', gender, {
        author: Peer.name(author)
      })

    case 'custom':
      return message.action.message

    case 'unknown':
      return lang.use('me_unsupported_service_message')
  }
}
