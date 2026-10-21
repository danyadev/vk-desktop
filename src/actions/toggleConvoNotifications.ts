import { useServices } from 'services'
import * as Convo from 'model/Convo'

export async function setConvoNotifications(convo: Convo.Convo, time: number) {
  const { api } = useServices()
  await api.fetch('account.setSilenceMode', { peer_id: convo.id, time })
}

export async function toggleConvoNotifications(convo: Convo.Convo) {
  await setConvoNotifications(convo, convo.notifications.enabled ? -1 : 0)
}

export async function toggleConvoNotificationSound(convo: Convo.Convo) {
  const { api } = useServices()
  await api.fetch('account.setSilenceMode', {
    peer_id: convo.id,
    sound: convo.notifications.soundEnabled ? 0 : 1
  })
}
