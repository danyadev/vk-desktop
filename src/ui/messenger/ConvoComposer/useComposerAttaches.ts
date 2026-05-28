import { computed } from 'vue'
import * as Attach from 'model/Attach'
import * as Convo from 'model/Convo'
import * as ConvoDraft from 'model/ConvoDraft'
import { fromApiAttachPhoto } from 'converters/AttachConverter'
import { useEnv } from 'hooks'

type AttachPreview =
  | { kind: 'Attach', attach: Attach.SingleAttach }
  | { kind: 'UploadingAttach', attach: ConvoDraft.UploadingAttach }

export function useComposerAttaches(convo: Convo.Convo, draft: ConvoDraft.ConvoDraft) {
  const { uploader } = useEnv()

  const attachPreviews = computed(() => {
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
  })

  const uploadPhoto = (file: File) => {
    const uploadingAttach = ConvoDraft.addUploadingAttach(draft, {
      kind: 'Photo',
      file,
      progress: 0,
      failed: false
    })

    uploader
      .uploadPhoto(file, convo.id, (progress: number) => {
        uploadingAttach.progress = progress
      })
      .then((apiPhoto) => {
        const photo = fromApiAttachPhoto(apiPhoto)
        if (photo) {
          Attach.add(draft.attaches, photo)
          ConvoDraft.removeUploadingAttach(draft, uploadingAttach)
        } else {
          uploadingAttach.failed = true
        }
      })
      .catch(() => {
        uploadingAttach.failed = true
      })
  }

  const removeAttachPreview = (attachPreview: AttachPreview) => {
    if (attachPreview.kind === 'UploadingAttach') {
      ConvoDraft.removeUploadingAttach(draft, attachPreview.attach)
    } else {
      Attach.remove(draft.attaches, attachPreview.attach)
    }
  }

  return {
    attachPreviews,
    removeAttachPreview,
    uploadPhoto
  }
}
