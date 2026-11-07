import { defineComponent } from 'vue'
import { useServices } from 'services'
import * as Lists from 'model/Lists'
import { loadMoreConvos } from 'actions'
import { ConvoActionMenu } from 'ui/messenger/ConvoActionMenu/ConvoActionMenu'
import { ConvoListItem } from 'ui/messenger/ConvoListView/ConvoListItem'
import { useConvoList } from 'ui/messenger/ConvoListView/useConvoList'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ConvoList.css'

type Props = {
  list: Lists.List
  compact?: boolean
}

export const ConvoList = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const convoList = useConvoList(props.list)

  return () => (
    <div class="ConvoList">
      {convoList.value.map((convo) => (
        <ConvoActionMenu key={convo.id} convo={convo} fromConvoList>
          <ConvoListItem convo={convo} compact={props.compact} />
        </ConvoActionMenu>
      ))}

      {convoList.value.length === 0 && props.list.status === 'complete' && (
        <div class="ConvoList__empty">
          {lang.use('me_convo_list_empty')}
        </div>
      )}

      {props.list.status === 'error' && (
        <LoadError onRetry={() => loadMoreConvos(props.list)} />
      )}

      {(props.list.status === 'loading' || props.list.status === 'hasMore') && (
        <IntersectionWrapper
          key={convoList.value.length}
          onIntersect={() => loadMoreConvos(props.list)}
        >
          <Spinner size="regular" class="ConvoList__spinner" />
        </IntersectionWrapper>
      )}
    </div>
  )
}, {
  props: ['list', 'compact']
})
