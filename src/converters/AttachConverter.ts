import { BaseImage } from 'model/api-types/objects/BaseImage'
import {
  MessagesMessageAttachment,
  MessagesMessageAttachmentWall
} from 'model/api-types/objects/MessagesMessageAttachment'
import { PhotosPhotoSize } from 'model/api-types/objects/PhotosPhotoSize'
import * as Attach from 'model/Attach'
import * as Peer from 'model/Peer'
import { insertPeers } from 'actions'
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

        const photo: Attach.Photo = {
          kind: 'Photo',
          id: apiAttach.photo.id,
          ownerId: Peer.resolveOwnerId(apiAttach.photo.owner_id),
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

      case 'wall': {
        const wall = apiAttach.wall && fromApiAttachWall(apiAttach.wall)

        if (!wall) {
          addUnknown(apiAttach)
          break
        }

        attaches.wall = wall
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

function fromApiAttachWall(apiWall: MessagesMessageAttachmentWall): Attach.Wall | undefined {
  const rawOwnerId = apiWall.owner_id ?? apiWall.to_id

  if (!apiWall.id || !rawOwnerId || !apiWall.from_id) {
    return
  }

  if (apiWall.from) {
    insertPeers(
      'first_name' in apiWall.from
        ? { profiles: [apiWall.from] }
        : { groups: [apiWall.from] }
    )
  }

  return {
    kind: 'Wall',
    id: apiWall.id,
    ownerId: Peer.resolveOwnerId(rawOwnerId),
    authorId: Peer.resolveOwnerId(apiWall.from_id),
    accessKey: apiWall.access_key,
    createdAt: (apiWall.date ?? 0) * 1000,
    text: apiWall.text ?? '',
    attaches: fromApiAttaches(apiWall.attachments ?? []),
    isDeleted: !!apiWall.is_deleted,
    donutPlaceholder: apiWall.donut?.placeholder?.text,
    repost: apiWall.copy_history?.[0]
      ? fromApiAttachWall(apiWall.copy_history[0])
      : undefined
  }
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
