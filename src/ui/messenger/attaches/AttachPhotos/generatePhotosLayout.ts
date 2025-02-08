import * as Attach from 'model/Attach'

type LayoutItem = {
  width: number
  height: number
  photo: Attach.Photo
}

export function generatePhotosLayout(photos: Attach.Photo[]) {
  const layoutItems = photos.map<LayoutItem>((photo) => ({
    width: photo.image.width,
    height: photo.image.height,
    photo
  }))
  const layout = groupPhotosIntoRows(layoutItems)

  return layout
}

function groupPhotosIntoRows(layoutItems: LayoutItem[]) {
  const count = layoutItems.length

  // [[1, (2), (3)]]
  if (count <= 3) {
    return [layoutItems]
  }
  // [[1, 2], [3, 4]]
  if (count === 4) {
    return [layoutItems.slice(0, 2), layoutItems.slice(2)]
  }
  // [[1, 2, 3], [4, 5, (6)]]
  if (count <= 6) {
    return [layoutItems.slice(0, 3), layoutItems.slice(3)]
  }
  // [[1, 2, 3], [4, 5], [6, 7]]
  if (count === 7) {
    return [layoutItems.slice(0, 3), layoutItems.slice(3, 5), layoutItems.slice(5)]
  }
  // [[1, 2, 3], [4, 5, 6], [7, 8, (9), (10)]]
  return [layoutItems.slice(0, 3), layoutItems.slice(3, 6), layoutItems.slice(6)]
}
