import * as Attach from 'model/Attach'
import * as Peer from 'model/Peer'
import { getMapValueWithDefaults } from 'misc/utils'

export type ConvoDraft = {
  text: string
  attaches: Attach.Attaches
  uploadingAttaches: UploadingAttach[]
}

export type UploadingAttach = GenericUploadingAttach<'Photo'>

type GenericUploadingAttach<Kind extends Attach.SingleAttach['kind']> = {
  kind: Kind
  file: File
  progress: number
  failed: boolean
}

const emptyDraft = (): ConvoDraft => ({
  text: '',
  attaches: {},
  uploadingAttaches: []
})

/**
 * Возвращает драфт сообщения в беседе.
 * Гарантируется, что всегда будет возвращаться один и тот же объект, и все изменения
 * будут происходить через его мутацию. Это позволяет избегать создание рефов в компонентах
 */
export function safeGet(drafts: Map<Peer.Id, ConvoDraft>, peerId: Peer.Id): ConvoDraft {
  return getMapValueWithDefaults(drafts, peerId, emptyDraft())
}

export function isEmpty(draft: ConvoDraft) {
  return draft.text.trim() === '' && Attach.kindsCount(draft.attaches) === 0
}

export function reset(draft: ConvoDraft) {
  Object.assign(draft, emptyDraft())
}

/**
 * Добавляет загружаемый аттач в драфт и возвращает его реактивную копию
 */
export function addUploadingAttach(draft: ConvoDraft, uploadingAttach: UploadingAttach) {
  const index = draft.uploadingAttaches.push(uploadingAttach) - 1
  return draft.uploadingAttaches[index]!
}

export function removeUploadingAttach(draft: ConvoDraft, uploadingAttach: UploadingAttach) {
  // TODO: отменять запрос на загрузку
  const index = draft.uploadingAttaches.indexOf(uploadingAttach)
  if (index !== -1) {
    draft.uploadingAttaches.splice(index, 1)
  }
}
