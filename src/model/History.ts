import * as Message from 'model/Message'

export type History = Array<Message.Message | Gap>

type Gap = {
  kind: 'Gap'
  fromCmid: Message.Cmid
  toCmid: Message.Cmid
}

export function lastMessage(history: History): Message.Message | undefined {
  const last = history.at(-1)

  if (last && last.kind !== 'Gap') {
    return last
  }

  return undefined
}
