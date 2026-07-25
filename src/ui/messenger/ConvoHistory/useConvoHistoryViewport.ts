import { nextTick, Ref } from 'vue'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import { useConvosStore, ViewportPosition } from 'store/convos'

export type VisibleMessageRange =
  | [firstCmid: undefined, lastCmid: undefined, firstRect: undefined, lastRect: undefined]
  | [firstCmid: Message.Cmid, lastCmid: Message.Cmid, firstRect: DOMRect, lastRect: DOMRect]

export const useConvoHistoryViewport = (
  convo: Convo.Convo,
  $historyElement: Ref<HTMLElement | null>,
  gapAround: Ref<History.Gap | undefined>,
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

  const scrollToAnchorIfNeeded = (instant: boolean) => {
    const scrollAnchor = scrollAnchors.get(convo.id)
    if (!scrollAnchor) {
      return
    }

    /**
     * При наличии scrollAnchor around() не переключается на соседний слайс на границе гэпа,
     * поэтому gapAround означает, что запрошенная позиция все еще не загружена.
     * Эта проверка нужна, чтобы предотвратить преждевременный фоллбэк на превью сообщения
     */
    if (gapAround.value) {
      return
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

      return
    }

    if (convo.historySliceAnchorCmid !== scrollAnchor.cmid) {
      convo.historySliceAnchorCmid = scrollAnchor.cmid
      return
    }

    if (scrollAnchor.kind === 'Message' && scrollAnchor.origin) {
      scrollAnchors.set(convo.id, { kind: 'Message', cmid: scrollAnchor.origin, highlight: false })
    } else {
      scrollAnchors.delete(convo.id)
    }
    openMessagePreview(scrollAnchor.cmid)
  }

  const scrollToInitialPosition = (startCmid: Message.Cmid) => {
    const historyElement = $historyElement.value
    if (!historyElement) {
      return
    }

    if (startCmid === convo.inReadBy) {
      const unreadElement = getUnreadElement()
      if (unreadElement) {
        // Скроллим к блоку непрочитанных так, чтобы он начинался в верхней четверти вьюпорта
        historyElement.scrollTop =
          unreadElement.offsetTop - historyElement.offsetTop - historyElement.offsetHeight / 4
        return
      }
    }

    let messageElement = getMessageElement(startCmid)

    if (!messageElement) {
      const messageElements = getMessageElements()

      messageElement =
        messageElements.find((element) => Number(element.dataset.cmid) > startCmid) ??
        messageElements.at(-1)
    }

    messageElement?.scrollIntoView({
      block: 'center',
      behavior: 'instant'
    })
  }

  const findVisibleMessageRange = (): VisibleMessageRange => {
    const historyElement = $historyElement.value
    if (!historyElement) {
      return [undefined, undefined, undefined, undefined]
    }

    const viewportRect = historyElement.getBoundingClientRect()
    let first: { cmid: Message.Cmid, rect: DOMRect } | undefined
    let last: { cmid: Message.Cmid, rect: DOMRect } | undefined

    for (const element of getMessageElements()) {
      const rect = element.getBoundingClientRect()

      if (rect.bottom <= viewportRect.top) {
        continue
      }
      if (rect.top >= viewportRect.bottom) {
        break
      }

      const visibleMessage = {
        cmid: Message.resolveCmid(Number(element.dataset.cmid)),
        rect
      }

      first ??= visibleMessage
      last = visibleMessage
    }

    return first && last
      ? [first.cmid, last.cmid, first.rect, last.rect]
      : [undefined, undefined, undefined, undefined]
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
    direction: 'around' | 'up' | 'down',
    startCmid: Message.Cmid
  ) => {
    if (direction === 'around') {
      // В случае around позиционируемся только после обновления DOM,
      // так как до этого вместо истории еще может отображаться лоадер
      await nextTick()
      scrollToInitialPosition(startCmid)
    } else {
      const [topMessageCmid] = findVisibleMessageRange()
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
    scrollToInitialPosition,
    findVisibleMessageRange,
    preserveMessagePosition,
    preserveViewportPosition,
    restoreViewportPosition
  }
}
