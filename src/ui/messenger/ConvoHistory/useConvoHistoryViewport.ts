import { nextTick, Ref } from 'vue'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import { useConvosStore, ViewportPosition } from 'store/convos'

export const useConvoHistoryViewport = (
  convo: Convo.Convo,
  $historyElement: Ref<HTMLElement | null>,
  openMessagePreview: (cmid: Message.Cmid) => void
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

  const scrollToAnchorIfNeeded = (instant: boolean): boolean => {
    const scrollAnchor = scrollAnchors.get(convo.id)
    if (!scrollAnchor) {
      return false
    }

    const element = scrollAnchor.kind === 'Unread'
      ? getUnreadElement() ?? getMessageElement(scrollAnchor.cmid)
      : getMessageElement(scrollAnchor.cmid)
    const behavior = instant ? 'instant' : 'smooth'

    if (element) {
      // По неведомой причине scrollIntoView с behavior: smooth не работает сразу же
      nextTick(() => {
        scrollAnchors.delete(convo.id)

        element.scrollIntoView({
          block: 'center',
          behavior
        })
      })

      return true
    }

    if (convo.historySliceAnchorCmid !== scrollAnchor.cmid) {
      convo.historySliceAnchorCmid = scrollAnchor.cmid
      return false
    }

    if (scrollAnchor.kind === 'Message' && scrollAnchor.origin) {
      scrollAnchors.set(convo.id, { kind: 'Message', cmid: scrollAnchor.origin, highlight: false })
    } else {
      scrollAnchors.delete(convo.id)
    }
    openMessagePreview(scrollAnchor.cmid)
    return true
  }

  const findTopVisibleCmid = (): [topCmid?: Message.Cmid, topRect?: DOMRect] => {
    const historyElement = $historyElement.value
    if (!historyElement) {
      return [undefined, undefined]
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

    return [closest?.cmid, closest?.rect]
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
      const [topMessageCmid] = findTopVisibleCmid()
      if (topMessageCmid) {
        // Так как мы можем находиться в любой позиции в истории в момент добавления сообщений,
        // нужно убедиться, что текущие сообщения во вьюпорте не будут обрезаны в windowSlice,
        // поэтому перемещаем anchorCmid на видимую позицию
        convo.historySliceAnchorCmid = topMessageCmid
        preserveMessagePosition(topMessageCmid)
      }
    }
  }

  const restoreViewportPosition = ({ cmid, offset }: ViewportPosition) => {
    const historyElement = $historyElement.value
    if (!historyElement) {
      return
    }

    const exactElement = getMessageElement(cmid)
    let messageElement = exactElement

    if (!messageElement) {
      const messageElements = getMessageElements()

      messageElement =
        messageElements.find((element) => Number(element.dataset.cmid) > cmid) ??
        messageElements.at(-1)
    }

    if (!messageElement) {
      return
    }

    // If we can't find the message, we pick another one, but we won't crop it
    const targetOffset = exactElement ? offset : Math.max(0, offset)
    const currentOffset =
      messageElement.getBoundingClientRect().top -
      historyElement.getBoundingClientRect().top

    historyElement.scrollTop += currentOffset - targetOffset
  }

  return {
    scrollToAnchorIfNeeded,
    findTopVisibleCmid,
    preserveMessagePosition,
    preserveViewportPosition,
    restoreViewportPosition
  }
}
