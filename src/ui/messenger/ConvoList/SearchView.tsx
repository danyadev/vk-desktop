import { defineComponent } from 'vue'
import { useServices } from 'services'
import { ConvoSearchResults } from 'ui/messenger/ConvoList/ConvoSearchResults'
import { MessageSearchResults } from 'ui/messenger/ConvoList/MessageSearchResults'
import { TabPage } from 'ui/ui/TabPage/TabPage'
import { TabView } from 'ui/ui/TabView/TabView'
import './SearchView.css'

export const SearchView = defineComponent<{ query: string }>((props) => {
  const { lang } = useServices()

  return () => (
    <TabView class="SearchView" wide keepAlive>
      <TabPage key="convos" title={lang.use('me_convo_list_search_convos')}>
        <ConvoSearchResults query={props.query} />
      </TabPage>
      <TabPage key="messages" title={lang.use('me_convo_list_search_messages')}>
        <MessageSearchResults query={props.query} />
      </TabPage>
    </TabView>
  )
}, {
  props: ['query']
})
