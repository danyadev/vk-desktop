import { Lang } from 'env/Lang'

type Attach = { type: string }

export function preview(attach: Attach, lang: Lang): string | null {
  switch (attach.type) {
    case 'photo':
    case 'video':
    case 'audio':
    case 'doc':
    case 'link':
      return lang.usePlural(`me_message_attach_${attach.type}`, 1)

    case 'gift':
    case 'sticker':
    case 'ugc_sticker':
    case 'wall':
    case 'wall_reply':
    case 'event':
    case 'audio_message':
    case 'audio_playlist':
    case 'artist':
    case 'curator':
    case 'article':
    case 'poll':
    case 'story':
    case 'narrative':
    case 'graffiti':
    case 'market':
    case 'podcast':
    case 'money_request':
    case 'money_transfer':
    case 'geo':
    case 'call':
    case 'group_call_in_progress':
    case 'mini_app':
    case 'app_action':
    case 'video_message':
    case 'widget':
    case 'question':
    case 'donut_link':
      return lang.use(`me_message_attach_${attach.type}`)

    default:
      return null
  }
}
