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

  const findTopVisibleCmid = () => {
    const historyElement = $historyElement.value
    if (!historyElement) {
      return
    }

    const viewportRect = historyElement.getBoundingClientRect()
    let closest

    for (const [cmid, element] of messageElements) {
      if (cmid === 'unread') {
        continue
      }

      const rect = element.getBoundingClientRect()
      const isVisible = rect.bottom > viewportRect.top && rect.top < viewportRect.bottom

      if (isVisible && (!closest || rect.top < closest.rect.top)) {
        closest = { cmid, rect }
      }
    }

    return closest?.cmid
  }

  // const preserveMessagePosition = async (cmid: Message.Cmid) => {
  //   const historyElement = $historyElement.value
  //   const messageElement = messageElements.get(cmid)
  //   if (!historyElement || !messageElement) {
  //     return
  //   }
  //
  //   const messageRect = messageElement.getBoundingClientRect()
  //   const oldOffset = messageRect.top - historyElement.getBoundingClientRect().top
  //
  //   await nextTick()
  //
  //   const newMessageElement = messageElements.get(cmid)
  //   if (!newMessageElement) {
  //     return
  //   }
  //
  //   const newMessageRect = newMessageElement.getBoundingClientRect()
  //   const newOffset = newMessageRect.top - historyElement.getBoundingClientRect().top
  //   const messageHeightDiff = messageRect.height - newMessageRect.height
  //
  //   historyElement.scrollTop += newOffset - oldOffset + messageHeightDiff
  // }

  let preserveSeq = 0

  const preserveMessagePosition = async (cmid: Message.Cmid) => {
    const seq = ++preserveSeq

    const historyElement = $historyElement.value
    const messageElement = messageElements.get(cmid)
    if (!historyElement || !messageElement) {
      console.log(`[preserve ${seq}] missing before`, { cmid })
      return
    }

    const snapshot = (stage: string) => {
      const historyRect = historyElement.getBoundingClientRect()
      const element = messageElements.get(cmid)
      const messageRect = element?.getBoundingClientRect()

      console.log(`[preserve ${seq}] ${stage}`, {
        cmid,

        scrollTop: historyElement.scrollTop,
        scrollHeight: historyElement.scrollHeight,
        clientHeight: historyElement.clientHeight,

        historyTop: historyRect.top,

        messageTop: messageRect?.top,
        messageBottom: messageRect?.bottom,
        messageHeight: messageRect?.height,

        offsetTop: messageRect
          ? messageRect.top - historyRect.top
          : undefined,

        offsetBottom: messageRect
          ? messageRect.bottom - historyRect.top
          : undefined
      })
    }

    const messageRect = messageElement.getBoundingClientRect()
    const oldOffset =
      messageRect.top -
      historyElement.getBoundingClientRect().top

    snapshot('BEFORE')

    await nextTick()

    snapshot('AFTER NEXT TICK')

    const newMessageElement = messageElements.get(cmid)
    if (!newMessageElement) {
      console.log(`[preserve ${seq}] message disappeared`, { cmid })
      return
    }

    const newMessageRect = newMessageElement.getBoundingClientRect()
    const newOffset =
      newMessageRect.top -
      historyElement.getBoundingClientRect().top

    const correction = newOffset - oldOffset

    console.log(`[preserve ${seq}] CORRECTION`, {
      cmid,
      oldOffset,
      newOffset,
      correction
    })

    historyElement.scrollTop += correction

    snapshot('AFTER CORRECTION')

    requestAnimationFrame(() => {
      snapshot('NEXT FRAME')
    })
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
      const topMessageCmid = findTopVisibleCmid()
      if (topMessageCmid) {
        preserveMessagePosition(topMessageCmid)
      }
    }
  }

  return {
    scrollToAnchorIfNeeded,
    findTopVisibleCmid,
    preserveMessagePosition,
    preserveViewportPosition
  }
}
