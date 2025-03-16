import * as Attach from 'model/Attach'

type LayoutItem = {
  width: number
  height: number
  photo: Attach.Photo
}

const GAP = 3

export function generatePhotosLayout(
  photos: Attach.Photo[],
  initialMaxWidth: number,
  initialMaxHeight: number
) {
  const layoutItems = photos.map<LayoutItem>((photo) => {
    const { width, height } = resizeToMatchMinDimensions(photo.image.width, photo.image.height, 50)
    return { width, height, photo }
  })
  const layout = groupPhotosIntoRows(layoutItems)
  const rowsCount = layout.length
  const maxHeight = initialMaxHeight - GAP * (rowsCount - 1)
  let totalHeight = 0

  const maxTotalWidth = layout.reduce((maxWidth, row) => {
    const totalWidth = row.reduce((width, photo) => width + photo.width, 0)
    return totalWidth > maxWidth ? totalWidth : maxWidth
  }, 0)

  for (const row of layout) {
    const photosInRowCount = row.length

    const maxWidth = initialMaxWidth - GAP * (photosInRowCount - 1)

    const rowAspectRatio =
      row.reduce((ratio, photo) => ratio + (photo.width / photo.height), 0)

    const rowHeight = Math.min(maxTotalWidth, maxWidth) / rowAspectRatio
    totalHeight += rowHeight

    for (const photo of row) {
      photo.width = (photo.width / photo.height) * rowHeight
      photo.height = rowHeight
    }
  }

  const fitToMaxHeightFactor = maxHeight / totalHeight

  if (fitToMaxHeightFactor < 1) {
    for (const row of layout) {
      for (const photo of row) {
        photo.width *= fitToMaxHeightFactor
        photo.height *= fitToMaxHeightFactor
      }
    }
  }

  return layout
}

function groupPhotosIntoRows(layoutItems: LayoutItem[]) {
  const count = layoutItems.length
  const preferVerticalPositioning = layoutItems.reduce(
    (ratio, photo) => ratio + photo.width / photo.height,
    0
  ) / count > 1

  // [[1], ([2]), ([3])]
  // or
  // [[1, (2), (3)]]
  if (count <= 3) {
    return preferVerticalPositioning
      ? layoutItems.map((photo) => [photo])
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

function resizeToMatchMinDimensions(
  width: number,
  height: number,
  minDimension: number
): { width: number, height: number } {
  const scaleX = minDimension / width
  const scaleY = minDimension / height

  if (width < minDimension && height < minDimension) {
    const scale = Math.max(scaleX, scaleY)
    return {
      width: width * scale,
      height: height * scale
    }
  }

  if (width < minDimension) {
    return {
      width: width * scaleX,
      height: height * scaleX
    }
  }

  if (height < minDimension) {
    return {
      width: width * scaleY,
      height: height * scaleY
    }
  }

  return { width, height }
}
