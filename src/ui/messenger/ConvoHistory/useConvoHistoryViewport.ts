import { nextTick, Ref } from 'vue'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import { useConvosStore, ViewportPosition } from 'store/convos'

type VisibleMessageRange =
  | [firstCmid: undefined, lastCmid: undefined, firstRect: undefined, lastRect: undefined]
  | [firstCmid: Message.Cmid, lastCmid: Message.Cmid, firstRect: DOMRect, lastRect: DOMRect]

export const useConvoHistoryViewport = (
  convo: Convo.Convo,
  $historyElement: Ref<HTMLElement | null>,
  loadingAround: Ref<boolean>,
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

    if (scrollAnchor.kind === 'Message' && scrollAnchor.reversible && !scrollAnchor.origin) {
      const viewportPosition = captureViewportPosition()
      if (viewportPosition) {
        scrollAnchor.origin = viewportPosition
      } else {
        scrollAnchor.reversible = false
      }
    }

    /**
     * При наличии scrollAnchor around() не переключается на соседний слайс на границе гэпа,
     * поэтому loadingAround означает, что запрошенная позиция все еще не загружена.
     * Эта проверка нужна, чтобы предотвратить преждевременный фоллбэк на превью сообщения
     */
    if (loadingAround.value) {
      return
    }

    const element = scrollAnchor.kind === 'Unread'
      ? getUnreadElement() ?? getMessageElement(scrollAnchor.cmid)
      : getMessageElement(scrollAnchor.cmid)
    const behavior = instant ? 'instant' : 'smooth'

    if (element) {
      if (scrollAnchor.kind === 'Message' && scrollAnchor.cmid === scrollAnchor.origin?.cmid) {
        restoreViewportPosition(scrollAnchor.origin)
        scrollAnchors.delete(convo.id)
        return
      }

      // По неведомой причине scrollIntoView с behavior: smooth не работает сразу же
      nextTick(() => {
        element.scrollIntoView({
          block: 'center',
          behavior
        })
      })
      scrollAnchors.delete(convo.id)
      return
    }

    if (convo.historySliceAnchorCmid !== scrollAnchor.cmid) {
      convo.historySliceAnchorCmid = scrollAnchor.cmid
      return
    }

    scrollAnchors.delete(convo.id)

    if (scrollAnchor.kind === 'Message') {
      if (scrollAnchor.origin && scrollAnchor.origin.cmid !== scrollAnchor.cmid) {
        scrollAnchors.set(convo.id, {
          kind: 'Message',
          cmid: scrollAnchor.origin.cmid,
          origin: scrollAnchor.origin,
          highlight: false
        })
      }
      openMessagePreview(scrollAnchor.cmid)
    }

    if (!scrollAnchors.has(convo.id)) {
      scrollToInitialPosition(scrollAnchor.cmid)
    }
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
    startCmid: Message.Cmid,
    mayFindInitialPosition: boolean
  ) => {
    const [topMessageCmid] = findVisibleMessageRange()
    if (topMessageCmid) {
      preserveMessagePosition(topMessageCmid)
      return
    }

    if (mayFindInitialPosition) {
      // Нужно дождаться окончания рендеринга лоадера
      await nextTick()
      scrollToInitialPosition(startCmid)
    }
  }

  const captureViewportPosition = (): ViewportPosition | undefined => {
    const historyElement = $historyElement.value
    if (!historyElement) {
      return
    }

    const [topCmid,, topRect] = findVisibleMessageRange()
    if (!topCmid) {
      return
    }

    const offset = topRect.top - historyElement.getBoundingClientRect().top
    return { cmid: topCmid, offset }
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
    captureViewportPosition,
    restoreViewportPosition
  }
}
