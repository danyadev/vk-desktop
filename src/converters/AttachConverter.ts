import { BaseImage } from 'model/api-types/objects/BaseImage'
import { MessagesMessageAttachment } from 'model/api-types/objects/MessagesMessageAttachment'
import * as Attach from 'model/Attach'
import { isNonEmptyArray } from 'misc/utils'

export function fromApiAttaches(apiAttaches: MessagesMessageAttachment[]): Attach.Attaches {
  const attaches: Attach.Attaches = {}

  const addUnknown = (attach: MessagesMessageAttachment) => {
    const unknown = {
      kind: 'Unknown' as const,
      type: attach.type,
      raw: attach
    }
    attaches.unknown = [...(attaches.unknown ?? []), unknown]
  }

  for (const apiAttach of apiAttaches) {
    switch (apiAttach.type) {
      case 'sticker':
        if (!apiAttach.sticker?.sticker_id || !apiAttach.sticker.product_id) {
          addUnknown(apiAttach)
          break
        }

        attaches.sticker = {
          kind: 'Sticker',
          id: apiAttach.sticker.sticker_id,
          packId: apiAttach.sticker.product_id,
          images: fromApiImageList(apiAttach.sticker.images ?? []),
          imagesWithBackground: fromApiImageList(apiAttach.sticker.images_with_background ?? [])
        }
        break

      default:
        addUnknown(apiAttach)
        break
    }
  }

  return attaches
}

function fromApiImageList(apiImages: BaseImage[]): Attach.ImageList | undefined {
  const images = apiImages.map((image) => ({
    url: image.url,
    width: image.width,
    height: image.height
  }))

  if (!isNonEmptyArray(images)) {
    return undefined
  }

  return images
}
