import { defineComponent } from 'vue'
import { useServices } from 'services'
import { ConvoSearchPage } from 'ui/messenger/SearchView/ConvoSearchPage'
import { MessageSearchPage } from 'ui/messenger/SearchView/MessageSearchPage'
import { TabPage } from 'ui/ui/TabPage/TabPage'
import { TabView } from 'ui/ui/TabView/TabView'
import './SearchView.css'

export const SearchView = defineComponent<{ query: string }>((props) => {
  const { lang } = useServices()

  return () => (
    <TabView class="SearchView" wide keepAlive>
      <TabPage key="convos" title={lang.use('me_convo_list_search_convos')}>
        <ConvoSearchPage query={props.query} />
      </TabPage>
      <TabPage key="messages" title={lang.use('me_convo_list_search_messages')}>
        <MessageSearchPage query={props.query} />
      </TabPage>
    </TabView>
  )
}, {
  props: ['query']
})
