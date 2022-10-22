export type MessagesConversation = {
  peer: {
    id: number
    local_id: number
    type: 'user' | 'group' | 'chat' | 'email'
  }
}
