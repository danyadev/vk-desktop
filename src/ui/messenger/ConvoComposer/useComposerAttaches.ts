import { computed } from 'vue'
import { useServices } from 'services'
import * as Attach from 'model/Attach'
import * as Convo from 'model/Convo'
import * as ConvoDraft from 'model/ConvoDraft'
import { fromApiAttachPhoto } from 'converters/AttachConverter'

export type AttachPreview =
  | { kind: 'Attach', attach: Attach.SingleAttach }
  | { kind: 'UploadingAttach', attach: ConvoDraft.UploadingAttach }

export function useComposerAttaches(convo: Convo.Convo, convoDraft: ConvoDraft.ConvoDraft) {
  const { uploader } = useServices()

  const attachPreviews = computed(() => {
    const attaches: AttachPreview[] = []
    const draftAttachesValues = Object.values(convoDraft.attaches)

    for (const attach of draftAttachesValues) {
      const attachesArray = Array.isArray(attach) ? attach : [attach]
      const uploadingAttaches = convoDraft.uploadingAttaches.filter((uploadingAttach) => (
        uploadingAttach.kind === attachesArray[0].kind
      ))

      attaches.push(
        ...attachesArray.map((attach) => ({ kind: 'Attach' as const, attach })),
        ...uploadingAttaches.map((attach) => ({ kind: 'UploadingAttach' as const, attach }))
      )
    }

    const restUploadingAttaches = convoDraft.uploadingAttaches
      .filter((uploadingAttach) => !attaches.some(({ attach }) => attach === uploadingAttach))
      .map((attach) => ({ kind: 'UploadingAttach' as const, attach }))

    attaches.push(...restUploadingAttaches)

    return attaches
  })

  const removeAttachPreview = (attachPreview: AttachPreview) => {
    if (attachPreview.kind === 'UploadingAttach') {
      ConvoDraft.removeUploadingAttach(convoDraft, attachPreview.attach)
    } else {
      Attach.remove(convoDraft.attaches, attachPreview.attach)
    }
  }

  const uploadPhoto = (draft: ConvoDraft.Draft, uploadingPhoto: ConvoDraft.UploadingPhoto) => {
    uploader
      .uploadPhoto(uploadingPhoto.file, convo.id, (progress) => {
        uploadingPhoto.progress = progress
      }, uploadingPhoto.abortController.signal)
      .then((apiPhoto) => {
        if (!draft.uploadingAttaches.includes(uploadingPhoto)) return

        const photo = fromApiAttachPhoto(apiPhoto)
        if (photo) {
          Attach.add(draft.attaches, photo)
          ConvoDraft.removeUploadingAttach(draft, uploadingPhoto)
        } else {
          uploadingPhoto.failed = true
        }
      })
      .catch(() => {
        uploadingPhoto.failed = true
      })
  }

  const uploadAttach = (kind: ConvoDraft.UploadingAttach['kind'], file: File) => {
    const draft = ConvoDraft.captureDraft(convoDraft)
    const uploadingAttach = ConvoDraft.addUploadingAttach(draft, {
      kind,
      id: ConvoDraft.getNewUploadingAttachId(),
      file,
      progress: 0,
      failed: false,
      abortController: new AbortController()
    })

    switch (kind) {
      case 'Photo':
        uploadPhoto(draft, uploadingAttach)
        break
    }
  }

  const retryUploadingAttach = (uploadingAttach: ConvoDraft.UploadingAttach) => {
    if (!uploadingAttach.failed) {
      throw new Error('Tried to retry not failed attach')
    }

    uploadingAttach.progress = 0
    uploadingAttach.failed = false
    uploadingAttach.abortController = new AbortController()

    switch (uploadingAttach.kind) {
      case 'Photo':
        uploadPhoto(ConvoDraft.captureDraft(convoDraft), uploadingAttach)
        break
    }
  }

  const abortUploadingAttach = (uploadingAttach: ConvoDraft.UploadingAttach) => {
    uploadingAttach.abortController.abort()
  }

  return {
    attachPreviews,
    removeAttachPreview,
    uploadAttach,
    retryUploadingAttach,
    abortUploadingAttach
  }
}
