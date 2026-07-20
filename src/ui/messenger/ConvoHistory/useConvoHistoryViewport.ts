import { nextTick, Ref } from 'vue'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import { useConvosStore } from 'store/convos'

export const useConvoHistoryViewport = (
  convo: Convo.Convo,
  $historyElement: Ref<HTMLDivElement | null>,
  historySlice: Ref<ReturnType<typeof History.around<Message.Confirmed>>>,
  messageElements: Map<Message.Cmid | 'unread', HTMLElement>
) => {
  const { scrollAnchors } = useConvosStore()

  const scrollToAnchorIfNeeded = (instant: boolean) => {
    const scrollAnchor = scrollAnchors.get(convo.id)
    if (!scrollAnchor || scrollAnchor.kind === 'None') {
      return
    }

    const element = scrollAnchor.kind === 'Unread'
      ? messageElements.get('unread') ?? messageElements.get(scrollAnchor.cmid)
      : messageElements.get(scrollAnchor.cmid)
    const behavior = instant ? 'instant' : 'smooth'

    if (element) {
      // По неведомой причине scrollIntoView с behavior: smooth не работает сразу же
      nextTick(() => {
        scrollAnchors.set(convo.id, { kind: 'None' })

        element.scrollIntoView({
          block: 'center',
          behavior
        })
      })

      return true
    }

    if (convo.historySliceAnchorCmid !== scrollAnchor.cmid) {
      convo.historySliceAnchorCmid = scrollAnchor.cmid
      return
    }

    if (historySlice.value.gapAround) {
      return
    }

    // Сообщения не оказалось в истории даже после загрузки истории вокруг кмида
    // TODO: показать модалку с превью сообщения
    // TODO: возвращаться обратно к сообщению откуда мы пытались перейти к другому сообщению
    // (либо предварительно смотреть в апи наличие сообщения и не грузить историю вообще)

    // Пока не реализована обработка ненайденного сообщения, скроллим к ближайшему следующему
    const messageCmids = [...messageElements.keys()]
      .filter((key) => key !== 'unread')
      .sort((a, b) => a - b)
    const messageCmid =
      messageCmids.find((cmid) => (cmid >= scrollAnchor.cmid)) ??
      messageCmids.at(-1)
    const messageElement = messageCmid && messageElements.get(messageCmid)

    if (messageElement) {
      nextTick(() => {
        scrollAnchors.set(convo.id, { kind: 'None' })

        messageElement.scrollIntoView({
          block: 'center',
          behavior
        })
      })

      return true
    }
  }

  const preserveViewportPosition = async (
    insertedMessages: Message.Confirmed[],
    direction: 'around' | 'up' | 'down',
    startCmid: Message.Cmid
  ) => {
    if (direction === 'around') {
      await nextTick()

      // В случае around элемент нужно доставать только после nextTick,
      // так как до этого момента он еще не успел замениться с лоадера чата
      const historyElement = $historyElement.value
      if (!historyElement) {
        return
      }

      if (startCmid === convo.inReadBy) {
        const unreadElement = messageElements.get('unread')
        if (unreadElement) {
          // Скроллим к блоку непрочитанных так, чтобы он начинался на верхней 1/4 части вьюпорта
          historyElement.scrollTop =
            unreadElement.offsetTop - historyElement.offsetTop - historyElement.offsetHeight / 4
          return
        }
      }

      // При загрузке вокруг кмида этого сообщения может не оказаться, тогда мы возьмем следующее
      const aroundMessage =
        insertedMessages.find(({ cmid }) => (cmid >= startCmid)) ??
        insertedMessages.at(-1)

      const messageElement = aroundMessage && messageElements.get(aroundMessage.cmid)
      messageElement?.scrollIntoView({
        block: 'center',
        behavior: 'instant'
      })
      return
    }

    if (direction === 'up') {
      // We're looking for the topmost visible message before new messages insertion.
      // It's going to be the first message with id larger than startCmid
      const topMessageCmid = historySlice.value.items
        .find((node) => node.id > startCmid)
        ?.item.cmid
      if (!topMessageCmid) {
        return
      }

      const beforeRect = messageElements.get(topMessageCmid)?.getBoundingClientRect()
      if (beforeRect === undefined) {
        return
      }

      await nextTick()

      const historyElement = $historyElement.value
      const afterRect = messageElements.get(topMessageCmid)?.getBoundingClientRect()
      if (!historyElement || afterRect === undefined) {
        return
      }

      historyElement.scrollTop += (afterRect.top - beforeRect.top) +
        (afterRect.height - beforeRect.height)
    }
  }

  return {
    scrollToAnchorIfNeeded,
    preserveViewportPosition
  }
}
