import { useServices } from 'services'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'

export async function editMessage(
  peerId: Peer.Id,
  cmid: Message.Cmid,
  text: string,
  attaches: Attach.Attaches
) {
  const { api } = useServices()
  const result = await api.fetch('messages.edit', {
    peer_id: peerId,
    cmid,
    message: text,
    attachment: Attach.ids(attaches),
    keep_forward_messages: 1,
    keep_snippets: 1
  })

  if (result !== 1) throw new Error('messages.edit returned ' + result)
}
