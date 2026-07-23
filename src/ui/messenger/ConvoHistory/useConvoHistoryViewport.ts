import { nextTick, Ref } from 'vue'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import { useConvosStore } from 'store/convos'

export const useConvoHistoryViewport = (
  convo: Convo.Convo,
  $historyElement: Ref<HTMLDivElement | null>,
  historySlice: Ref<ReturnType<typeof History.around<Message.Confirmed>>>
) => {
  const { scrollAnchors } = useConvosStore()

  const getUnreadElement = () => {
    return $historyElement.value?.querySelector<HTMLElement>('.ConvoHistory__unreadBlock')
  }

  const getMessageElement = (cmid: Message.Cmid) => {
    return $historyElement.value?.querySelector<HTMLElement>(`[data-cmid="${cmid}"]`)
  }

  const getMessageElements = () => {
    return [...$historyElement.value?.querySelectorAll<HTMLElement>('[data-cmid]') ?? []]
  }

  const scrollToAnchorIfNeeded = (instant: boolean) => {
    const scrollAnchor = scrollAnchors.get(convo.id)
    if (!scrollAnchor || scrollAnchor.kind === 'None') {
      return
    }

    const element = scrollAnchor.kind === 'Unread'
      ? getUnreadElement() ?? getMessageElement(scrollAnchor.cmid)
      : getMessageElement(scrollAnchor.cmid)
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
    const messageElements = getMessageElements()
    const messageElement =
      messageElements.find((el) => (Number(el.dataset.cmid) >= scrollAnchor.cmid)) ??
      messageElements.at(-1)

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

  const findTopVisibleCmid = () => {
    const historyElement = $historyElement.value
    if (!historyElement) {
      return
    }

    const viewportRect = historyElement.getBoundingClientRect()
    let closest

    for (const element of getMessageElements()) {
      const cmid = Message.resolveCmid(Number(element.dataset.cmid))
      const rect = element.getBoundingClientRect()
      const isVisible = rect.bottom > viewportRect.top && rect.top < viewportRect.bottom

      if (isVisible && (!closest || rect.top < closest.rect.top)) {
        closest = { cmid, rect }
      }
    }

    return closest?.cmid
  }

  const preserveMessagePosition = async (cmid: Message.Cmid) => {
    const historyElement = $historyElement.value
    const messageElement = getMessageElement(cmid)
    if (!historyElement || !messageElement) {
      return
    }

    const messageRect = messageElement.getBoundingClientRect()
    const oldOffset = messageRect.top - historyElement.getBoundingClientRect().top

    await nextTick()

    const newMessageElement = getMessageElement(cmid)
    if (!newMessageElement) {
      return
    }

    const newMessageRect = newMessageElement.getBoundingClientRect()
    const newOffset = newMessageRect.top - historyElement.getBoundingClientRect().top
    const messageHeightDiff = messageRect.height - newMessageRect.height

    historyElement.scrollTop += newOffset - oldOffset - messageHeightDiff
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
        const unreadElement = getUnreadElement()
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

      const messageElement = aroundMessage && getMessageElement(aroundMessage.cmid)
      messageElement?.scrollIntoView({
        block: 'center',
        behavior: 'instant'
      })
    } else {
      const topMessageCmid = findTopVisibleCmid()
      if (topMessageCmid) {
        // Так как мы можем находиться в любой позиции в истории в момент добавления сообщений,
        // нужно убедиться, что текущие сообщения во вьюпорте не будут обрезаны в windowSlice,
        // поэтому перемещаем anchorCmid на видимую позицию
        convo.historySliceAnchorCmid = topMessageCmid
        preserveMessagePosition(topMessageCmid)
      }
    }
  }

  return {
    scrollToAnchorIfNeeded,
    preserveMessagePosition,
    preserveViewportPosition
  }
}
