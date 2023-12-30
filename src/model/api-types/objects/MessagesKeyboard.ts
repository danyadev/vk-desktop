export type MessagesKeyboard = {
  author_id?: number
  buttons: MessagesKeyboardButton[][]
  one_time: boolean
  inline?: boolean
}

type MessagesKeyboardButton = {
  action: {
    type: 'text' | 'start' | 'location' | 'vkpay' | 'open_app' | 'open_photo' | 'open_link' | 'callback' | 'intent_subscribe' | 'intent_unsubscribe'
    label?: string
    payload?: string
    link?: string
    /** Fragment value in app link like vk.com/app{app_id}_-654321#hash */
    app_id?: number
    /** Fragment value in app link like vk.com/app123456_-654321#{hash} */
    hash?: string
    /** Fragment value in app link like vk.com/app123456_{owner_id}#hash */
    owner_id?: number
  }
  color?: 'default' | 'positive' | 'negative' | 'primary'
}
