import { defineComponent } from 'vue'
import { useConvosStore } from 'store/convos'
import { ConvoList } from 'ui/messenger/ConvoListView/ConvoList'
import { TabPage } from 'ui/ui/TabPage/TabPage'
import { TabView } from 'ui/ui/TabView/TabView'
import './ConvoListView.css'

type Props = {
  compact?: boolean
}

export const ConvoListView = defineComponent<Props>((props) => {
  const { lists } = useConvosStore()

  return () => (
    <TabView class="ConvoListView" keepAlive>
      <TabPage key="main" title={lists.main.name}>
        <ConvoList list={lists.main} compact={props.compact} />
      </TabPage>
      <TabPage key="unread" title={lists.unread.name}>
        <ConvoList list={lists.unread} compact={props.compact} />
      </TabPage>
      <TabPage key="archive" title={lists.archive.name}>
        <ConvoList list={lists.archive} compact={props.compact} />
      </TabPage>
    </TabView>
  )
}, {
  props: ['compact']
})
