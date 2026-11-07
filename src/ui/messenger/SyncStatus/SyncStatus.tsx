import { defineComponent, Transition } from 'vue'
import { useServices } from 'services'
import { useConvosStore } from 'store/convos'
import './SyncStatus.css'

type Props = {
  edge: 'top' | 'bottom'
  show?: boolean
}

export const SyncStatus = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const { connection } = useConvosStore()

  return () => (
    <Transition name="SyncStatus">
      {connection.status === 'syncing' && (
        <div
          class={['SyncStatus', props.edge === 'bottom' && 'SyncStatus--bottom']}
          hidden={props.show === false}
        >
          {lang.use('me_syncing')}
        </div>
      )}
    </Transition>
  )
}, {
  props: ['edge', 'show']
})
