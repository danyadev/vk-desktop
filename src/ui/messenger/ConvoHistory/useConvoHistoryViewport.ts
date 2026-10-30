import { nextTick, onBeforeUnmount, Ref, shallowRef, watch } from 'vue'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import { ConvoSession, ViewportPosition } from 'store/convos'
import { useGlobalModal } from 'hooks'

type VisibleMessageRange =
  | [firstCmid: undefined, lastCmid: undefined, firstRect: undefined, lastRect: undefined]
  | [firstCmid: Message.Cmid, lastCmid: Message.Cmid, firstRect: DOMRect, lastRect: DOMRect]

const MIN_MESSAGE_HEIGHT = 35
const MESSAGE_GAP = 8
const WINDOW_WING_MIN_MESSAGES = 20
const WINDOW_WING_BUFFER_MESSAGES = 5

export const useConvoHistoryViewport = (
  convo: Convo.Convo,
  session: ConvoSession,
  $historyElement: Ref<HTMLElement | null>,
  hasAroundGap: Ref<boolean>
) => {
  const { messageViewerModal } = useGlobalModal()
  const messagesWindowWingSize = shallowRef(WINDOW_WING_MIN_MESSAGES)

  const resizeObserver = new ResizeObserver(([entry]) => {
    const viewportHeight = entry?.contentRect.height
    if (!viewportHeight) {
      return
    }

    const calculatedSize = Math.ceil(
      (viewportHeight + MESSAGE_GAP) / (MIN_MESSAGE_HEIGHT + MESSAGE_GAP)
    ) + WINDOW_WING_BUFFER_MESSAGES
    const newSize = Math.max(WINDOW_WING_MIN_MESSAGES, calculatedSize)
    if (newSize === messagesWindowWingSize.value) {
      return
    }

    messagesWindowWingSize.value = newSize

    if (session.navigationRequest) {
      return
    }

    const [topMessageCmid] = findVisibleMessageRange()
    if (topMessageCmid) {
      session.anchorCmid = topMessageCmid
      preserveMessagePosition(topMessageCmid)
    }
  })

  watch($historyElement, (element, previousElement) => {
    if (previousElement) {
      resizeObserver.unobserve(previousElement)
    }

    if (element) {
      resizeObserver.observe(element)
    }
  }, { flush: 'post' })

  onBeforeUnmount(() => {
    resizeObserver.disconnect()
  })

  const getUnreadElement = () => {
    return $historyElement.value?.querySelector<HTMLElement>('.HistoryMessages__unreadBlock')
  }

  const getMessageElement = (cmid: Message.Cmid) => {
    return $historyElement.value?.querySelector<HTMLElement>(`[data-cmid="${cmid}"]`)
  }

  const getMessageElements = () => {
    return [...$historyElement.value?.querySelectorAll<HTMLElement>('[data-cmid]') ?? []]
  }

  const getNearbyMessageElement = (cmid: Message.Cmid) => {
    const exact = getMessageElement(cmid)
    if (exact) {
      return exact
    }

    const messageElements = getMessageElements()
    const next = messageElements.find((element) => getCmid(element) > cmid)
    return next ?? messageElements.at(-1)
  }

  const getCmid = (messageElement: HTMLElement) => {
    return Message.resolveCmid(Number(messageElement.dataset.cmid))
  }

  const scrollToMessage = (element: HTMLElement, behavior: ScrollBehavior) => {
    const history = $historyElement.value
    if (!history) return

    const viewport = history.getBoundingClientRect()
    const target = element.getBoundingClientRect()
    const desiredTop = target.height > viewport.height
      ? viewport.height / 4
      : (viewport.height - target.height) / 2

    history.scrollTo({
      top: history.scrollTop + target.top - viewport.top - desiredTop,
      behavior
    })
  }

  const advanceNavigationRequest = (instantScroll: boolean) => {
    const request = session.navigationRequest
    if (!request) {
      return
    }

    let element: HTMLElement | null | undefined
    let requestedCmid: Message.Cmid | undefined

    if (request.kind === 'Bottom') {
      requestedCmid = Convo.lastMessage(convo)?.cmid
    } else {
      requestedCmid = request.cmid

      if (request.kind === 'Unread') {
        element = getUnreadElement() ?? getMessageElement(request.cmid)
      } else if (request.landNearbyIfMissing && session.anchorCmid === request.cmid) {
        element = getNearbyMessageElement(request.cmid)
      } else {
        element = getMessageElement(request.cmid)
      }
    }

    if (element) {
      if (request.kind === 'Message' && request.cmid === request.origin?.cmid) {
        restoreViewportPosition(request.origin)
      } else {
        // По неведомой причине scrollIntoView с behavior: smooth не работает сразу же
        nextTick(() => {
          scrollToMessage(element, instantScroll ? 'instant' : 'smooth')
        })
      }
      session.navigationRequest = undefined
      return
    }

    if (!requestedCmid) {
      session.navigationRequest = undefined
      return
    }

    if (session.anchorCmid !== requestedCmid) {
      if (request.kind === 'Message' && !request.landNearbyIfMissing) {
        request.origin = captureViewportPosition()
      }
      session.anchorCmid = requestedCmid
      return
    }

    /**
     * При навигации History.around() не переключается на соседний слайс на границе гэпа,
     * поэтому hasAroundGap означает, что запрошенная позиция все еще не загружена.
     * Эта проверка нужна, чтобы предотвратить преждевременный фоллбэк на превью сообщения
     */
    if (hasAroundGap.value) {
      return
    }

    if (request.kind === 'Bottom') {
      nextTick(() => {
        const history = $historyElement.value
        history?.scrollTo({
          top: history.scrollHeight,
          behavior: instantScroll ? 'instant' : 'smooth'
        })
      })
      session.navigationRequest = undefined
      return
    }

    session.navigationRequest = undefined

    if (request.kind === 'Message' && !request.landNearbyIfMissing) {
      if (request.origin && request.cmid !== request.origin.cmid) {
        session.navigationRequest = {
          kind: 'Message',
          cmid: request.origin.cmid,
          highlight: false,
          landNearbyIfMissing: true,
          origin: request.origin
        }
      }
      messageViewerModal.open({ peerId: convo.id, cmid: request.cmid })
    }

    if (!session.navigationRequest) {
      scrollToInitialPosition(request.cmid)
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

    const messageElement = getNearbyMessageElement(startCmid)
    if (messageElement) {
      scrollToMessage(messageElement, 'instant')
    }
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

      const visibleMessage = { cmid: getCmid(element), rect }
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

    const messageElement = getNearbyMessageElement(cmid)
    if (!messageElement) {
      return
    }

    // If we couldn't find the message, we picked another one, but we won't crop it
    const targetOffset = getCmid(messageElement) === cmid
      ? offset
      : Math.max(0, offset)
    const currentOffset =
      messageElement.getBoundingClientRect().top -
      historyElement.getBoundingClientRect().top

    historyElement.scrollTop += currentOffset - targetOffset
  }

  return {
    messagesWindowWingSize,
    advanceNavigationRequest,
    scrollToInitialPosition,
    findVisibleMessageRange,
    preserveMessagePosition,
    captureViewportPosition,
    restoreViewportPosition
  }
}
