import { defineComponent, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import { type ConvoSearchProps, ConvoSearchResults } from 'ui/messenger/ConvoList/ConvoSearchResults'
import { MessageSearchResults } from 'ui/messenger/ConvoList/MessageSearchResults'
import { Tabs } from 'ui/ui/Tabs/Tabs'
import { TabsItem } from 'ui/ui/TabsItem/TabsItem'
import './SearchView.css'

type SearchTab = 'convos' | 'messages'

export const SearchView = defineComponent<ConvoSearchProps>((props) => {
  const { lang } = useServices()
  const activeTab = shallowRef<SearchTab>('convos')
  const $list = shallowRef<HTMLElement | null>(null)

  watch([() => props.query, activeTab], () => $list.value?.scrollTo({ top: 0 }))

  return () => (
    <div class="SearchView">
      <Tabs wide class="SearchView__tabs">
        <TabsItem
          active={activeTab.value === 'convos'}
          onClick={() => (activeTab.value = 'convos')}
        >
          {lang.use('me_convo_list_search_convos')}
        </TabsItem>
        <TabsItem
          active={activeTab.value === 'messages'}
          onClick={() => (activeTab.value = 'messages')}
        >
          {lang.use('me_convo_list_search_messages')}
        </TabsItem>
      </Tabs>

      <div class="SearchView__results" ref={$list}>
        {activeTab.value === 'convos' ? (
          <ConvoSearchResults {...props} />
        ) : (
          <MessageSearchResults query={props.query} />
        )}
      </div>
    </div>
  )
}, {
  props: ['query', 'status', 'results', 'onRetry']
})
