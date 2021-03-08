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
  thumb.height = columnItem ? height : Math.max(height, 50);

  if (lastColumn) thumb.lastColumn = lastColumn;
  if (lastRow) thumb.lastRow = lastRow;
  if (columnItem) thumb.columnItem = columnItem;
}

function calcOnePhotoSize(photo, ratios, maxWidth, maxHeight) {
  if (photo.height < 50) {
    photo.height = 50;
    photo.width = 50 * ratios[0];
  }

  if (photo.height > maxHeight) {
    photo.height = maxHeight;
    photo.width = maxHeight * ratios[0];
  }

  if (photo.width < 50) {
    photo.width = 50;
    photo.height = 50 / ratios[0];
  }

  if (photo.width > maxWidth) {
    photo.width = maxWidth;
    photo.height = maxWidth / ratios[0];
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
// eslint-disable-next-line import/no-unused-modules
export function calculatePhotosLayout({ thumbs, margin, maxWidth, maxHeight }) {
  // Копируем массив для предотвращения мутации оригинального массива
  thumbs = thumbs.map((thumb) => ({ ...thumb }));

  const photoRatios = [];
  let photoRatioTypes = '';
  let photoRatioSum = 0;

  for (const thumb of thumbs) {
    if (thumb.width === 0 && thumb.height === 0) {
      thumb.width = 100;
      thumb.height = 100;
    }

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
      const mediumHeight = Math.min((thumbs[0].height + thumbs[1].height) / 2, maxHeight);
      const height = Math.min(
        (width / photoRatios[0] + width / photoRatios[1]) / 2,
        (mediumHeight - margin) / 2
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
      const mediumRightPhotosHeight = (thumbs[1].height + thumbs[2].height) / 2;
      const height1 = Math.min(
        maxHeight,
        Math.max(
          Math.min(thumbs[0].height, mediumRightPhotosHeight * 1.5),
          Math.min(mediumRightPhotosHeight, thumbs[0].height * 1.5),
          mediumRightPhotosHeight * .75
        )
      );
      // Высота p3
      const height2 = photoRatios[1] * (height1 - margin) / (photoRatios[2] + photoRatios[1]);
      // Высота p2
      const height3 = height1 - height2 - margin;
      const width1 = Math.min(height1 * photoRatios[0], (maxWidth - margin) * .75);
      const width2 = Math.min(
        maxWidth - width1 - margin,
        Math.max(
          (height3 * photoRatios[1] + height2 * photoRatios[2]) / 2,
          width1 / 3 // (3/4) / 3 = 1/4
        )
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
      const width2 = Math.min(maxWidth - width1 - margin, Math.max(heightModifier, 65));

      updateThumb(t0, width1, height1, false, true);
      updateThumb(t1, width2, height2, true, false, true);
      updateThumb(t2, width2, height3, true, false, true);
      updateThumb(t3, width2, height4, true, true, true);
    }
  } else {
    const photosLayoutVariants = {
      [thumbs.length]: [getMultiThumbsHeight(photoRatios, maxWidth, margin)]
    };

    const minPhotosAtFirstRow = thumbs.length < 7 ? 1 : 2;

    for (let i = minPhotosAtFirstRow; i < thumbs.length - 1; i++) {
      photosLayoutVariants[`${i},${thumbs.length - i}`] = [
        getMultiThumbsHeight(photoRatios.slice(0, i), maxWidth, margin),
        getMultiThumbsHeight(photoRatios.slice(i, thumbs.length), maxWidth, margin)
      ];
    }

    for (let i = minPhotosAtFirstRow; i < thumbs.length - 1; i++) {
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
    let reservedMaxWidthAndLayout = [];
    const minPhotoWidth = 65;

    for (const key in photosLayoutVariants) {
      const photosHeight = photosLayoutVariants[key];
      const photosInRows = key.split(',');
      // Math.abs нужен для того, чтобы считать размеры, максимально приближенные
      // к максимальной высоте сетки. Например, при выборе между
      // [-500, 50, 500] победит именно 50, так как он ближе всего к 0
      const heightDiff = Math.abs(
        (getArraySum(photosHeight) + margin * (photosHeight.length - 1)) - maxHeight
      );
      let index = 0;
      let isPhotoWidthLessThanMin = false;

      for (let row = 0; row < photosInRows.length; row++) {
        for (let column = 0; column < photosInRows[row]; column++) {
          const width = photoRatios[index++] * photosHeight[row];

          if (width < minPhotoWidth) {
            const [prevWidth] = reservedMaxWidthAndLayout;

            if (!prevWidth || width > prevWidth) {
              reservedMaxWidthAndLayout = [width, key, heightDiff];
            }

            isPhotoWidthLessThanMin = true;
          }
        }
      }

      if (isPhotoWidthLessThanMin) {
        continue;
      }

      if (!optimalPhotosLayout || heightDiff < minHeightDiff) {
        optimalPhotosLayout = key;
        minHeightDiff = heightDiff;
      }
    }

    if (!optimalPhotosLayout) {
      [, optimalPhotosLayout, minHeightDiff] = reservedMaxWidthAndLayout;
    }

    const rowHeights = photosLayoutVariants[optimalPhotosLayout];
    const photosInRows = optimalPhotosLayout.split(',');
    let photoIndex = 0;

    for (let column = 0; column < photosInRows.length; column++) {
      const photosInRow = photosInRows[column];
      const rowHeight = rowHeights[column];

      for (let row = 0; row < photosInRow; row++) {
        const index = photoIndex++;
        const width = photoRatios[index] * rowHeight;
        const lastColumn = row === photosInRow - 1;
        const lastRow = column === photosInRows.length - 1;

        updateThumb(thumbs[index], width, rowHeight, lastColumn, lastRow);
      }
    }
  }

  return thumbs;
}
