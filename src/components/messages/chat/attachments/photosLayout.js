function getArraySum(arr) {
  let sum = 0;

  for (let i = arr.length; i--;) {
    sum += arr[i];
  }

  return sum;
}

function getMultiThumbsHeight(ratios, width, margin) {
  return (width - (ratios.length - 1) * margin) / getArraySum(ratios);
}

function updateThumb(thumb, width, height, lastColumn, lastRow, columnItem) {
  thumb.width = width;
  thumb.height = columnItem ? height : Math.max(height, 100);

  if (lastColumn) thumb.lastColumn = lastColumn;
  if (lastRow) thumb.lastRow = lastRow;
  if (columnItem) thumb.columnItem = columnItem;
}

function calcOnePhotoSize(photo, ratios, maxWidth, maxHeight) {
  const minPhotoWidth = 100;

  if (photo.width < minPhotoWidth) {
    photo.width = minPhotoWidth;
  }

  if (photo.width > maxWidth) {
    photo.width = maxWidth;
    photo.height = maxWidth / ratios[0];
  }

  if (photo.height > maxHeight) {
    photo.height = maxHeight;
    photo.width = maxHeight * ratios[0];
  }

  ratios[0] = photo.width / photo.height;

  return photo;
}

function calcTwoPhotosWidth(photos, ratios, maxWidth, margin) {
  const minPhotoWidth = 100;

  // 1. Каждая фотография должна быть больше минимального размера
  if (photos[0].width < minPhotoWidth) {
    photos[0].width = minPhotoWidth;
    ratios[0] = photos[0].width / photos[0].height;
  }

  if (photos[1].width < minPhotoWidth) {
    photos[1].width = minPhotoWidth;
    ratios[1] = photos[1].width / photos[1].height;
  }

  let width1 = photos[0].width;
  let width2 = photos[1].width;

  // 2. Фотографии помещаются в сетку, их не нужно ресайзить
  if (width1 + width2 + margin <= maxWidth) {
    return [width1, width2];
  }

  // 3. Фотографии не помещаются в сетку, сжимаем их
  const k = (width1 + width2) / (maxWidth - margin);

  width1 /= k;
  width2 /= k;

  if (width1 < minPhotoWidth) {
    const correction = minPhotoWidth - width1;
    width1 += correction;
    width2 -= correction;
  }

  if (width2 < minPhotoWidth) {
    const correction = minPhotoWidth - width2;
    width2 += correction;
    width1 -= correction;
  }

  return [width1, width2];
}

/**
 * const newHeight = newWidth / ratio;
 * const newWidth = newHeight * ratio;
 */

// thumbs = [{ width, height, ...rest }]: массив фоток
// margin: расстояние между фотками
// maxWidth, maxHeight: максимальные размеры родителя
export function calculatePhotosLayout({ thumbs, margin, maxWidth, maxHeight }) {
  // Копируем массив для предотвращения мутации оригинального массива
  thumbs = thumbs.map((thumb) => ({ ...thumb }));

  const photoRatios = [];
  let photoRatioTypes = '';
  let photoRatioSum = 0;

  for (const thumb of thumbs) {
    const ratio = Math.max(thumb.width / thumb.height, .3);

    photoRatioTypes += ratio > 1.2 ? 'w' : (ratio < .8 ? 'n' : 'q');
    photoRatioSum += ratio;
    photoRatios.push(ratio);
  }

  const ratioAverage = photoRatioSum / photoRatios.length;
  const parentRatio = maxWidth / maxHeight;

  if (thumbs.length === 1) {
    const { width, height } = calcOnePhotoSize(thumbs[0], photoRatios, maxWidth, maxHeight);
    updateThumb(thumbs[0], width, height, true, true);
  } else if (thumbs.length === 2) {
    if (
      photoRatioTypes === 'ww' &&
      ratioAverage > 1.4 * parentRatio &&
      Math.abs(photoRatios[1] - photoRatios[0]) < .3
    ) {
      // Одинаковая высота и ширина
      // Только если фотографии похожи по соотношению
      // [photo]
      // [photo]
      const width = Math.min(maxWidth, Math.max(thumbs[0].width, thumbs[1].width));
      const minHeight = Math.min((thumbs[0].height + thumbs[1].height) / 2, maxHeight);
      const height = Math.min(
        (width / photoRatios[0] + width / photoRatios[1]) / 2,
        (minHeight - margin) / 2
      );

      updateThumb(thumbs[0], width, height, true, false);
      updateThumb(thumbs[1], width, height, true, true);
    } else {
      // Одинаковая высота, но разная ширина
      // [photo][photo]
      const [width1, width2] = calcTwoPhotosWidth(thumbs, photoRatios, maxWidth, margin);
      const height = Math.min(maxHeight, (width1 / photoRatios[0] + width2 / photoRatios[1]) / 2);

      updateThumb(thumbs[0], width1, height, false, true);
      updateThumb(thumbs[1], width2, height, true, true);
    }
  } else if (thumbs.length === 3) {
    if (photoRatioTypes === 'www') {
      // [photo1]
      // [p2][p3]
      const width1 = Math.min(
        maxWidth,
        Math.max(thumbs[0].width, (thumbs[1].width + thumbs[2].width) / 2 + margin)
      );
      const width2 = (width1 - margin) / 2;
      const height1 = Math.min(width1 / photoRatios[0], (maxHeight - margin) * (2 / 3));
      const height2 = Math.min(
        maxHeight - height1 - margin,
        (width2 / photoRatios[1] + width2 / photoRatios[2]) / 2
      );

      updateThumb(thumbs[0], width1, height1, true, false);
      updateThumb(thumbs[1], width2, height2, false, true);
      updateThumb(thumbs[2], width2, height2, true, true);
    } else {
      // [photo1][p2]
      // [      ][p3]
      const height1 = Math.min(maxHeight, thumbs[0].height);
      // Высота p3
      const height2 = photoRatios[1] * (height1 - margin) / (photoRatios[2] + photoRatios[1]);
      // Высота p2
      const height3 = height1 - height2 - margin;
      const width1 = Math.min(height1 * photoRatios[0], (maxWidth - margin) * .75);
      const width2 = Math.min(
        maxWidth - width1 - margin,
        (height3 * photoRatios[1] + height2 * photoRatios[2]) / 2
      );

      updateThumb(thumbs[0], width1, height1, false, true);
      updateThumb(thumbs[1], width2, height3, true, false, true);
      updateThumb(thumbs[2], width2, height2, true, true, true);
    }
  } else if (thumbs.length === 4) {
    if (photoRatioTypes === 'wwww') {
      // Вытянутые по горизонтали фотографии
      // [  photo1  ]
      // [p2][p3][p4]
      const [t0, t1, t2, t3] = thumbs;
      const minWidth = Math.min(
        Math.max((t1.width + t2.width + t3.width) / 3, 250),
        maxWidth
      );
      const widthModifier = (
        (minWidth - margin * 2) / (photoRatios[1] + photoRatios[2] + photoRatios[3])
      );
      const width1 = minWidth;
      const width2 = widthModifier * photoRatios[1];
      const width3 = widthModifier * photoRatios[2];
      const width4 = widthModifier * photoRatios[3];
      const height1 = Math.min(width1 / photoRatios[0], (minWidth - margin) * (2 / 3));
      const height2 = Math.min(maxHeight - height1 - margin, widthModifier);

      updateThumb(t0, width1, height1, true, false);
      updateThumb(t1, width2, height2, false, true);
      updateThumb(t2, width3, height2, false, true);
      updateThumb(t3, width4, height2, true, true);
    } else {
      // Вытянутые по вертикали фотографии
      // [      ][p2]
      // [photo1][p3]
      // [      ][p4]
      const [t0, t1, t2, t3] = thumbs;
      const minHeight = Math.min(
        Math.max((t1.height + t2.height + t3.height) / 3, 280),
        maxHeight
      );
      const heightModifier = (
        (minHeight - margin * 2) / (1 / photoRatios[1] + 1 / photoRatios[2] + 1 / photoRatios[3])
      );
      const height1 = minHeight;
      const height2 = heightModifier / photoRatios[1];
      const height3 = heightModifier / photoRatios[2];
      const height4 = heightModifier / photoRatios[3];
      const width1 = Math.min(height1 * photoRatios[0], (maxWidth - margin) * (2 / 3));
      const width2 = Math.min(maxWidth - width1 - margin, heightModifier);

      updateThumb(t0, width1, height1, false, true);
      updateThumb(t1, width2, height2, true, false, true);
      updateThumb(t2, width2, height3, true, false, true);
      updateThumb(t3, width2, height4, true, true, true);
    }
  } else {
    const photosLayoutVariants = {
      [thumbs.length]: [getMultiThumbsHeight(photoRatios, maxWidth, margin)]
    };

    for (let i = 1; i < thumbs.length; i++) {
      photosLayoutVariants[`${i},${thumbs.length - i}`] = [
        getMultiThumbsHeight(photoRatios.slice(0, i), maxWidth, margin),
        getMultiThumbsHeight(photoRatios.slice(i, thumbs.length), maxWidth, margin)
      ];
    }

    for (let i = 1; i < thumbs.length - 1; i++) {
      for (let j = 1; j < thumbs.length - i; j++) {
        photosLayoutVariants[`${i},${j},${thumbs.length - i - j}`] = [
          getMultiThumbsHeight(photoRatios.slice(0, i), maxWidth, margin),
          getMultiThumbsHeight(photoRatios.slice(i, i + j), maxWidth, margin),
          getMultiThumbsHeight(photoRatios.slice(i + j, thumbs.length), maxWidth, margin)
        ];
      }
    }

    // Оптимальное расположение фотографий рассчитывается путем
    // нахождения положения фотографий с наименьшей разницей между
    // высотой родилетя и высотой своей сетки.
    // Все возможные положения находятся в photosLayoutVariants.
    let optimalPhotosLayout = null;
    let minHeightDiff = 0;

    for (const key in photosLayoutVariants) {
      const photosHeight = photosLayoutVariants[key];

      // Math.abs нужен для того, чтобы считать размеры, максимально приближенные
      // к максимальной высоте сетки. Например, при выборе между
      // [-500, 50, 500] победит именно 50, так как он ближе всего к 0
      const layoutHeight = getArraySum(photosHeight) + margin * (photosHeight.length - 1);
      const heightDiff = Math.abs(layoutHeight - maxHeight);

      if (!optimalPhotosLayout || heightDiff < minHeightDiff) {
        optimalPhotosLayout = key;
        minHeightDiff = heightDiff;
      }
    }

    const thumbsCopy = thumbs.slice();
    const photosInRowArr = optimalPhotosLayout.split(',');
    const rowHeights = photosLayoutVariants[optimalPhotosLayout];

    for (let i = 0; i < photosInRowArr.length; i++) {
      const photosInRow = photosInRowArr[i];
      const photos = thumbsCopy.splice(0, photosInRow);
      const rowHeight = rowHeights[i];

      for (let j = 0; j < photos.length; j++) {
        const width = photoRatios.splice(0, 1)[0] * rowHeight;
        const height = rowHeight;
        const lastColumn = photos.length - 1 === j;
        const lastRow = photosInRowArr.length - 1 === i;

        updateThumb(photos[j], width, height, lastColumn, lastRow);
      }
    }
  }

  return thumbs;
}
