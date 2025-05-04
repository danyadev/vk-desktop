import { BaseImage } from 'model/api-types/objects/BaseImage'
import {
  MessagesMessageAttachment,
  MessagesMessageAttachmentWall
} from 'model/api-types/objects/MessagesMessageAttachment'
import { PhotosPhoto } from 'model/api-types/objects/PhotosPhoto'
import { PhotosPhotoSize } from 'model/api-types/objects/PhotosPhotoSize'
import * as Attach from 'model/Attach'
import * as Peer from 'model/Peer'
import { insertPeers } from 'actions'
import { isNonEmptyArray } from 'misc/utils'

export function fromApiAttaches(
  apiAttaches: MessagesMessageAttachment[],
  wasVoiceMessageListened: boolean
): Attach.Attaches {
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

      case 'audio_message': {
        if (!apiAttach.audio_message) {
          addUnknown(apiAttach)
          break
        }

        attaches.voice = {
          kind: 'Voice',
          id: apiAttach.audio_message.id,
          ownerId: Peer.resolveOwnerId(apiAttach.audio_message.owner_id),
          accessKey: apiAttach.audio_message.access_key,
          linkMp3: apiAttach.audio_message.link_mp3,
          linkOgg: apiAttach.audio_message.link_ogg,
          duration: apiAttach.audio_message.duration,
          waveform: apiAttach.audio_message.waveform,
          wasListened: wasVoiceMessageListened,
          transcript: apiAttach.audio_message.transcript?.trim() ?? '',
          transcriptState: apiAttach.audio_message.transcript_state
        }
        break
      }

      case 'photo': {
        const photo = apiAttach.photo && fromApiAttachPhoto(apiAttach.photo)

        if (!photo) {
          addUnknown(apiAttach)
          break
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
          title: apiAttach.link.title || apiAttach.link.description || '',
          caption: apiAttach.link.caption || apiAttach.link.url,
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
    attaches: fromApiAttaches(apiWall.attachments ?? [], true),
    isDeleted: !!apiWall.is_deleted,
    donutPlaceholder: apiWall.donut?.placeholder?.text,
    repost: apiWall.copy_history?.[0]
      ? fromApiAttachWall(apiWall.copy_history[0])
      : undefined
  }
}

export function fromApiAttachPhoto(apiPhoto: PhotosPhoto): Attach.Photo | undefined {
  if (!apiPhoto.orig_photo) {
    return
  }

  return {
    kind: 'Photo',
    id: apiPhoto.id,
    ownerId: Peer.resolveOwnerId(apiPhoto.owner_id),
    accessKey: apiPhoto.access_key,
    image: apiPhoto.orig_photo,
    sizes: fromApiImageSizes(apiPhoto.sizes ?? [])
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
