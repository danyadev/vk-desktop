import { defineComponent } from 'vue'
import { useServices } from 'services'
import { ConvoSearch } from 'ui/messenger/SearchView/ConvoSearch'
import { MessageSearch } from 'ui/messenger/SearchView/MessageSearch'
import { TabPage } from 'ui/ui/TabPage/TabPage'
import { TabView } from 'ui/ui/TabView/TabView'
import './SearchView.css'

export const SearchView = defineComponent<{ query: string }>((props) => {
  const { lang } = useServices()

  return () => (
    <TabView class="SearchView" wide keepAlive>
      <TabPage key="convos" title={lang.use('me_convo_list_search_convos')}>
        <ConvoSearch query={props.query} />
      </TabPage>
      <TabPage key="messages" title={lang.use('me_convo_list_search_messages')}>
        <MessageSearch query={props.query} />
      </TabPage>
    </TabView>
  )
}, {
  props: ['query']
})
