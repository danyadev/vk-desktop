import * as Attach from 'model/Attach'
import * as Peer from 'model/Peer'
import { useConvoDraftsStore } from 'store/convoDrafts'
import { getMapValueWithDefaults } from 'misc/utils'

export type ConvoDraft = {
  text: string
  attaches: Attach.Attaches
  uploadingAttaches: UploadingAttach[]
}

export type UploadingAttach = GenericUploadingAttach<'Photo'>

type GenericUploadingAttach<Kind extends string> = {
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
export function get(peerId: Peer.Id): ConvoDraft {
  const { drafts } = useConvoDraftsStore()
  return getMapValueWithDefaults(drafts, peerId, emptyDraft())
}

export function isEmpty(draft: ConvoDraft, countUploading = true) {
  return (
    draft.text === '' &&
    Attach.kindsCount(draft.attaches) === 0 &&
    (!countUploading || draft.uploadingAttaches.length === 0)
  )
}

export function reset(draft: ConvoDraft) {
  Object.assign(draft, emptyDraft())
}
