import { defineComponent } from 'vue'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useEnv } from 'hooks'
import './ServiceMessage.css'

type Props = {
  message: Message.Service
}

export const ServiceMessage = defineComponent<Props>((props) => {
  const { lang } = useEnv()
  const author = Peer.safeGet(props.message.authorId)
  const gender = author.kind === 'User' ? author.gender : 'unknown'

  return () => {
    const { message } = props

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

        const target = Peer.safeGet(message.action.peerId)

        return lang.useGender(`me_service_${message.action.type}`, gender, {
          author: Peer.name(author),
          target: Peer.name(target, 'acc')
        })
      }

      case 'chat_invite_user_by_message_request':
      case 'chat_invite_user_by_call': {
        const target = Peer.safeGet(message.action.peerId)

        return lang.useGender(`me_service_${message.action.type}`, gender, {
          author: Peer.name(author),
          target: Peer.name(target, 'acc')
        })
      }

      case 'accepted_message_request': {
        const target = Peer.safeGet(message.action.peerId)
        return lang.use('me_service_accepted_message_request', {
          target: Peer.name(target)
        })
      }

      case 'chat_kick_user_call_block': {
        const target = Peer.safeGet(message.action.peerId)
        return lang.useGender('me_service_chat_kick_user_call_block', gender, {
          target: Peer.name(target)
        })
      }

      case 'chat_pin_message':
      case 'chat_unpin_message':
        return lang.useGender(`me_service_${message.action.type}`, gender, {
          author: Peer.name(author),
          message: message.action.message
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

      case 'custom':
        return message.action.message

      case 'unknown':
        return lang.use('me_unsupported_message')
    }
  }
}, {
  props: ['message']
})
