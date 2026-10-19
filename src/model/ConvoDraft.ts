import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { getMapValueOrCompute } from 'misc/utils'

export type Draft = {
  text: string
  attaches: Attach.Attaches
  replyMessage: Message.Foreign | undefined
  uploadingAttaches: UploadingAttach[]
}

export type ConvoDraft = Draft & {
  editing?: {
    message: Message.Normal
    previousDraft: Draft
  }
}

export type UploadingAttach = UploadingPhoto
export type UploadingPhoto = GenericUploadingAttach<'Photo'>

type GenericUploadingAttach<Kind extends Attach.SingleAttach['kind']> = {
  kind: Kind
  id: number
  file: File
  progress: number
  failed: boolean
  abortController: AbortController
}

const emptyDraft = (): Draft => ({
  text: '',
  attaches: {},
  replyMessage: undefined,
  uploadingAttaches: []
})

const emptyConvoDraft = (): ConvoDraft => ({
  ...emptyDraft(),
  editing: undefined
})

/**
 * Снимок текущего драфта. Полезен, когда нужно читать и записывать данные в реактивные поля
 * даже после замены основного драфта на драфт редактирования. Текст не является реактивным полем
 */
export function captureDraft(draft: Draft): Draft {
  return { ...draft }
}

export function startEditing(draft: ConvoDraft, message: Message.Normal) {
  if (draft.editing) return

  const previousDraft = captureDraft(draft)
  Object.assign(draft, {
    text: message.text,
    attaches: Attach.copy(message.attaches),
    replyMessage: message.replyMessage,
    uploadingAttaches: [],
    editing: { message, previousDraft }
  } satisfies ConvoDraft)
}

export function finishEditing(draft: ConvoDraft) {
  if (!draft.editing) return

  cancelUploads(draft)
  Object.assign(draft, draft.editing.previousDraft, { editing: undefined })
}

export function isEdited(draft: Draft, message: Message.Normal) {
  return (
    draft.text !== message.text ||
    draft.replyMessage?.cmid !== message.replyMessage?.cmid ||
    Attach.ids(draft.attaches) !== Attach.ids(message.attaches) ||
    Attach.count(draft.attaches) !== Attach.count(message.attaches) ||
    draft.uploadingAttaches.length > 0
  )
}

/**
 * Возвращает драфт сообщения в беседе.
 * Гарантируется, что всегда будет возвращаться один и тот же объект, и все изменения
 * будут происходить через его мутацию. Это позволяет избегать создание рефов в компонентах
 */
export function safeGet(drafts: Map<Peer.Id, ConvoDraft>, peerId: Peer.Id): ConvoDraft {
  return getMapValueOrCompute(drafts, peerId, emptyConvoDraft)
}

export function hasContent(draft: Draft) {
  return draft.text.trim() !== '' || Attach.kindsCount(draft.attaches) > 0
}

export function isEmpty(convoDraft: ConvoDraft) {
  return (
    !convoDraft.editing &&
    !convoDraft.replyMessage &&
    !convoDraft.uploadingAttaches.length &&
    !hasContent(convoDraft)
  )
}

function cancelUploads(draft: Draft) {
  for (const attach of draft.uploadingAttaches.splice(0)) {
    attach.abortController.abort()
  }
}

export function reset(convoDraft: ConvoDraft) {
  cancelUploads(convoDraft)
  Object.assign(convoDraft, emptyConvoDraft())
}

let uploadingAttachId = 0

export function getNewUploadingAttachId() {
  return uploadingAttachId++
}

/**
 * Добавляет загружаемый аттач в драфт и возвращает его реактивную копию
 */
export function addUploadingAttach(draft: Draft, uploadingAttach: UploadingAttach) {
  const index = draft.uploadingAttaches.push(uploadingAttach) - 1
  return draft.uploadingAttaches[index]!
}

export function removeUploadingAttach(draft: Draft, uploadingAttach: UploadingAttach) {
  const index = draft.uploadingAttaches.indexOf(uploadingAttach)
  if (index !== -1) {
    draft.uploadingAttaches.splice(index, 1)
    uploadingAttach.abortController.abort()
  }
}
