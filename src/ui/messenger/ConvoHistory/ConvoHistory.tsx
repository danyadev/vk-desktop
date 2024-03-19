import { defineComponent } from 'vue'
import * as Convo from 'model/Convo'
import { ServiceMessage } from 'ui/messenger/ServiceMessage/ServiceMessage'

type Props = {
  convo: Convo.Convo
}

export const ConvoHistory = defineComponent<Props>(({ convo }) => {
  return () => (
    <div class="ConvoHistory">
      {convo.history.map((message) => {
        if (message.kind === 'Gap') {
          return <div style="text-align: center">Gap {message.fromCmid}..{message.toCmid}</div>
        }

        if (message.kind === 'Service') {
          return <ServiceMessage message={message} />
        }

        if (message.kind === 'Expired') {
          return 'Expired'
        }

        return (
          <div>
            cmid: {message.cmid}<br />
            authorId: {message.authorId}<br />
            message: {message.text}
          </div>
        )
      })}
    </div>
  )
}, {
  props: ['convo']
})
