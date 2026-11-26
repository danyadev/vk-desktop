import * as Attach from 'model/Attach'

export type MediaLayoutItem = {
  media: Attach.Media
  width: number
  height: number
}

export function generateMediaLayout(media: Attach.Media[]) {
  const layoutItems = media.map<MediaLayoutItem>((item) => {
    const dimensions = item.kind === 'Photo' ? item.image : item
    return { media: item, width: dimensions.width, height: dimensions.height }
  })

  return groupMediaIntoRows(layoutItems)
}

function groupMediaIntoRows(layoutItems: MediaLayoutItem[]) {
  const count = layoutItems.length
  const preferVerticalPositioning = layoutItems.reduce(
    (ratio, item) => ratio + item.width / item.height,
    0
  ) / count > 1.2

  // [[1], ([2]), ([3])]
  // or
  // [[1, (2), (3)]]
  if (count <= 3) {
    return preferVerticalPositioning
      ? layoutItems.map((item) => [item])
      : [layoutItems]
  }

  // [[1, 2], [3, 4]]
  if (count === 4) {
    return [layoutItems.slice(0, 2), layoutItems.slice(2)]
  }

  // [[1], [2, 3], [4, 5]]
  // or
  // [[1, 2], [3, 4, 5]]
  if (count === 5) {
    return preferVerticalPositioning
      ? [layoutItems.slice(0, 1), layoutItems.slice(1, 3), layoutItems.slice(3)]
      : [layoutItems.slice(0, 2), layoutItems.slice(2)]
  }

  // [[1, 2], [3, 4], [5, 6]]
  // or
  // [[1, 2, 3], [4, 5, 6]]
  if (count === 6) {
    return preferVerticalPositioning
      ? [layoutItems.slice(0, 2), layoutItems.slice(2, 4), layoutItems.slice(4)]
      : [layoutItems.slice(0, 3), layoutItems.slice(3)]
  }

  // [[1, 2], [3, 4], [5, 6, 7]]
  if (count === 7) {
    return [layoutItems.slice(0, 2), layoutItems.slice(2, 4), layoutItems.slice(4)]
  }

  // [[1, 2], [3, 4, 5], [6, 7, 8]
  if (count === 8) {
    return [layoutItems.slice(0, 2), layoutItems.slice(2, 5), layoutItems.slice(5)]
  }

  // [[1, 2, 3], [4, 5, 6], [7, 8, 9, (10)]]
  return [layoutItems.slice(0, 3), layoutItems.slice(3, 6), layoutItems.slice(6)]
}
