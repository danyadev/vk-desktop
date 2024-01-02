export type MessagesKeyboard = {
  author_id?: number
  buttons: MessagesKeyboardButton[][]
  one_time: boolean
  inline?: boolean
}

type MessagesKeyboardButton = {
  action:
    | MessageKeyboardButtonText
    | MessageKeyboardButtonLocation
    | MessageKeyboardButtonVkpay
    | MessageKeyboardButtonOpenApp
    | MessageKeyboardButtonOpenPhoto
    | MessageKeyboardButtonOpenLink
    | MessageKeyboardButtonOpenModalView
    | MessageKeyboardButtonCallback
  color?: 'default' | 'positive' | 'negative' | 'primary'
}

type MessageKeyboardButtonText = {
  type: 'text'
  label: string
  payload?: string
}

type MessageKeyboardButtonLocation = {
  type: 'location'
  payload?: string
}

type MessageKeyboardButtonVkpay = {
  type: 'vkpay'
  /** Fragment value in app link like vk.com/app123456_-654321#{hash} */
  hash: string
  payload?: string
}

type MessageKeyboardButtonOpenApp = {
  type: 'open_app'
  label: string
  /** Fragment value in app link like vk.com/app{app_id}_-654321#hash */
  app_id: number
  /** Fragment value in app link like vk.com/app123456_-654321#{hash} */
  hash?: string
  /** Fragment value in app link like vk.com/app123456_{owner_id}#hash */
  owner_id: number
  payload?: string
}

type MessageKeyboardButtonOpenPhoto = {
  type: 'open_photo'
}

type MessageKeyboardButtonOpenLink = {
  type: 'open_link'
  label: string
  link: string
  payload?: string
}

type MessageKeyboardButtonOpenModalView = {
  type: 'open_modal_view'
  label: string
  link: string
  payload?: string
}

type MessageKeyboardButtonCallback = {
  type: 'callback'
  label: string
  payload?: string
}
