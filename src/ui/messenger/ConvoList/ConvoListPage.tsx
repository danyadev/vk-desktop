import { defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useConvosStore } from 'store/convos'
import { ConvoListContent } from 'ui/messenger/ConvoList/ConvoListContent'
import { SyncStatus } from 'ui/messenger/SyncStatus/SyncStatus'
import { TabPage } from 'ui/ui/TabPage/TabPage'
import { TabView } from 'ui/ui/TabView/TabView'

type Props = {
  compact?: boolean
}

export const ConvoListPage = defineComponent<Props>((props) => {
  const route = useRoute()
  const { lists } = useConvosStore()

  return () => (
    <div class="ConvoList__page">
      <TabView class="ConvoList__folders" keepAlive>
        <TabPage key="main" title={lists.main.name}>
          <ConvoListContent list={lists.main} compact={props.compact} />
        </TabPage>
        <TabPage key="unread" title={lists.unread.name}>
          <ConvoListContent list={lists.unread} compact={props.compact} />
        </TabPage>
        <TabPage key="archive" title={lists.archive.name}>
          <ConvoListContent list={lists.archive} compact={props.compact} />
        </TabPage>
      </TabView>

      {!props.compact && <SyncStatus edge="top" show={route.name !== 'Convo'} />}
    </div>
  )
}, {
  props: ['compact']
})
