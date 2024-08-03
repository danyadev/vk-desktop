import { BaseImage } from 'model/api-types/objects/BaseImage'
import { MessagesMessageAttachment } from 'model/api-types/objects/MessagesMessageAttachment'
import { PhotosPhotoSize } from 'model/api-types/objects/PhotosPhotoSize'
import * as Attach from 'model/Attach'
import * as Peer from 'model/Peer'
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
      case 'sticker': {
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
      }

      case 'photo': {
        if (!apiAttach.photo?.orig_photo) {
          addUnknown(apiAttach)
          break
        }

        const ownerId = Peer.resolveId(apiAttach.photo.owner_id)
        if (!Peer.isUserPeerId(ownerId) && !Peer.isGroupPeerId(ownerId)) {
          addUnknown(apiAttach)
          break
        }

        const photo: Attach.Photo = {
          kind: 'Photo',
          id: apiAttach.photo.id,
          ownerId,
          accessKey: apiAttach.photo.access_key,
          image: apiAttach.photo.orig_photo
        }

        attaches.photos = [...(attaches.photos ?? []), photo]
        break
      }

      case 'link': {
        if (!apiAttach.link) {
          addUnknown(apiAttach)
          break
        }

        const link: Attach.Link = {
          kind: 'Link',
          url: apiAttach.link.url,
          title: apiAttach.link.title ?? '',
          caption: apiAttach.link.caption ?? apiAttach.link.url,
          imageSizes: apiAttach.link.photo?.sizes
            ? fromApiImageSizes(apiAttach.link.photo.sizes)
            : undefined
        }

        attaches.links = [...(attaches.links ?? []), link]
        break
      }

      default: {
        addUnknown(apiAttach)
        break
      }
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

function fromApiImageSizes(apiImageSizes: PhotosPhotoSize[]): Attach.ImageSizes {
  const sizes: Attach.ImageSizes = new Map()

  for (const size of apiImageSizes) {
    sizes.set(size.type as Attach.ImageSize, size)
  }

  return sizes
}
