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

export type AttachPreview =
  | { kind: 'Attach', attach: Attach.SingleAttach }
  | { kind: 'UploadingAttach', attach: UploadingAttach }

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

/**
 * Добавляет загружаемый аттач в драфт и возвращает его реактивную копию
 */
export function addUploadingAttach(draft: ConvoDraft, uploadingAttach: UploadingAttach) {
  const index = draft.uploadingAttaches.push(uploadingAttach)
  return draft.uploadingAttaches[index]!
}

export function removeUploadingAttach(draft: ConvoDraft, uploadingAttach: UploadingAttach) {
  // TODO: отменять запрос на загрузку
  const index = draft.uploadingAttaches.indexOf(uploadingAttach)
  if (index !== -1) {
    draft.uploadingAttaches.splice(index, 1)
  }
}

export function getAttachesList(draft: ConvoDraft): AttachPreview[] {
  const attaches: AttachPreview[] = []
  const draftAttachesValues = Object.values(draft.attaches)

  for (const attach of draftAttachesValues) {
    const attachesArray = Array.isArray(attach) ? attach : [attach]
    const uploadingAttaches = draft.uploadingAttaches.filter((uploadingAttach) => (
      uploadingAttach.kind === attachesArray[0].kind
    ))

    attaches.push(
      ...attachesArray.map((attach) => ({ kind: 'Attach' as const, attach })),
      ...uploadingAttaches.map((attach) => ({ kind: 'UploadingAttach' as const, attach }))
    )
  }

  const restUploadingAttaches = draft.uploadingAttaches
    .filter((uploadingAttach) => !attaches.some(({ attach }) => attach === uploadingAttach))
    .map((attach) => ({ kind: 'UploadingAttach' as const, attach }))

  attaches.push(...restUploadingAttaches)

  return attaches
}
