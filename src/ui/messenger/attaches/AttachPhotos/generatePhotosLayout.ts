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

  for (const row of layout) {
    const photosInRowCount = row.length

    const maxWidth = initialMaxWidth - GAP * (photosInRowCount - 1)
    const totalWidth = row.reduce((width, photo) => width + photo.width, 0)

    const rowAspectRatio = row.reduce((ratio, photo) => ratio + (photo.width / photo.height), 0)

    const rowHeight = Math.min(totalWidth, maxWidth) / rowAspectRatio
    const fitInHeightFactor = Math.min(1, maxHeight / (rowHeight * rowsCount))

    for (const photo of row) {
      photo.width = (photo.width / photo.height) * rowHeight * fitInHeightFactor
      photo.height = rowHeight * fitInHeightFactor
    }
  }

  return layout
}

function groupPhotosIntoRows(layoutItems: LayoutItem[]) {
  const count = layoutItems.length

  // [[1, (2), (3)]]
  // or
  // [[1], ([2]), ([3])]
  if (count <= 3) {
    const meanAspectRatio = layoutItems.reduce(
      (ratio, photo) => ratio + photo.width / photo.height,
      0
    ) / count

    return meanAspectRatio > 1
      ? layoutItems.map((photo) => [photo])
      : [layoutItems]
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
