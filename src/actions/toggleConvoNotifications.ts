import { useServices } from 'services'
import * as Convo from 'model/Convo'

export async function toggleConvoNotifications(convo: Convo.Convo) {
  const { api } = useServices()
  const enabled = !convo.notifications.enabled
  await api.fetch('account.setSilenceMode', {
    peer_id: convo.id,
    sound: enabled ? 1 : 0,
    time: enabled ? 0 : -1
  })
}
