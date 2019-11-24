function getArraySum(arr) {
  let sum = 0;

  for(let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }

  return sum;
}

function calculateMultiThumbsHeight(ratios, width, margin) {
  return (width - (ratios.length - 1) * margin) / getArraySum(ratios);
}

function updateThumb(thumb, width, height, lastColumn, lastRow, columnItem) {
  thumb.width = width;
  thumb.height = height;
  if(lastColumn) thumb.lastColumn = lastColumn;
  if(lastRow) thumb.lastRow = lastRow;
  if(columnItem) thumb.columnItem = columnItem;
}

// thumbs = [{ width, height, ...rest }]: массив фоток
// margin: расстояние между фотками
// parentWidth, parentHeight: максимальные размеры родителя
export default function processThumbnails({ thumbs, margin, parentWidth, parentHeight }) {
  // Копируем массив для предотвращения мутации оригинального массива
  thumbs = thumbs.map((thumb) => Object.assign({}, thumb));

  const photoRatios = [];
  let photoRatioTypes = '';
  let photoRatioSum = 0;

  for(const thumb of thumbs) {
    const ratio = thumb.width / thumb.height;

    photoRatioTypes += ratio > 1.2 ? 'w' : (ratio < .8 ? 'n' : 'q');
    photoRatioSum += ratio;
    photoRatios.push(ratio);
  }

  const ratioAverage = photoRatioSum / photoRatios.length;
  const parentRatio = parentWidth / parentHeight;

  if(thumbs.length == 1) {
    if(photoRatios[0] > .8) {
      updateThumb(thumbs[0], parentWidth, parentWidth / photoRatios[0], true, true);
    } else {
      updateThumb(thumbs[0], parentHeight * photoRatios[0], parentHeight, true, true);
    }
  } else if(thumbs.length == 2) {
    if(photoRatioTypes == 'ww' && ratioAverage > 1.4 * parentRatio && photoRatios[1] - photoRatios[0] < .2) {
      const width = parentWidth;
      const height = Math.min(parentWidth / photoRatios[0], parentWidth / photoRatios[1], (parentHeight - margin) / 2);

      updateThumb(thumbs[0], width, height, true, false);
      updateThumb(thumbs[1], width, height, true, true);
    } else if(photoRatioTypes == 'ww' || photoRatioTypes == 'qq') {
      const width = (parentWidth - margin) / 2;
      const height = Math.min(width / photoRatios[0], width / photoRatios[1], parentHeight);

      updateThumb(thumbs[0], width, height, false, true);
      updateThumb(thumbs[1], width, height, true, true);
    } else {
      const width1 = (parentWidth - margin) / photoRatios[1] / (1 / photoRatios[0] + 1 / photoRatios[1]);
      const width2 = parentWidth - width1 - margin;
      const height = Math.min(parentHeight, width1 / photoRatios[0], width2 / photoRatios[1]);

      updateThumb(thumbs[0], width1, height, false, true);
      updateThumb(thumbs[1], width2, height, true, true);
    }
  } else if(thumbs.length == 3) {
    if(photoRatioTypes == 'www') {
      const width1 = parentWidth;
      const width2 = (parentWidth - margin) / 2;
      const height1 = Math.min(width1 / photoRatios[0], (parentHeight - margin) * .66);
      const height2 = Math.min(parentHeight - height1 - margin, width2 / photoRatios[1], width2 / photoRatios[2]);

      updateThumb(thumbs[0], width1, height1, true, false);
      updateThumb(thumbs[1], width2, height2, false, true);
      updateThumb(thumbs[2], width2, height2, true, true);
    } else {
      const height1 = parentHeight;
      const height2 = photoRatios[1] * (parentHeight - margin) / (photoRatios[2] + photoRatios[1]);
      const height3 = parentHeight - height2 - margin;
      const width1 = Math.min(height1 * photoRatios[0], (parentWidth - margin) * .75);
      const width2 = Math.min(parentWidth - width1 - margin, height2 * photoRatios[2], height3 * photoRatios[1]);

      updateThumb(thumbs[0], width1, height1, false, true);
      updateThumb(thumbs[1], width2, height3, true, false, true);
      updateThumb(thumbs[2], width2, height2, true, true, true);
    }
  } else if(thumbs.length == 4) {
    if(photoRatioTypes == 'wwww') {
      const widthModifier = (parentWidth - 2 * margin) / (photoRatios[1] + photoRatios[2] + photoRatios[3]);
      const width1 = parentWidth;
      const width2 = widthModifier * photoRatios[1];
      const width3 = widthModifier * photoRatios[2];
      const width4 = widthModifier * photoRatios[3];
      const height1 = Math.min(width1 / photoRatios[0], (parentHeight - margin) * .66);
      const height2 = Math.min(parentHeight - height1 - margin, widthModifier);

      updateThumb(thumbs[0], width1, height1, true, false);
      updateThumb(thumbs[1], width2, height2, false, false);
      updateThumb(thumbs[2], width3, height2, false, false);
      updateThumb(thumbs[3], width4, height2, false, false);
    } else {
      const heightModifier = (parentHeight - 2 * margin) / (1 / photoRatios[1] + 1 / photoRatios[2] + 1 / photoRatios[3]);
      const height1 = parentHeight;
      const height2 = heightModifier / photoRatios[1];
      const height3 = heightModifier / photoRatios[2];
      const height4 = heightModifier / photoRatios[3];
      const width1 = Math.min(height1 * photoRatios[0], (parentWidth - margin) * .66);
      const width2 = Math.min(parentWidth - width1 - margin, heightModifier);

      updateThumb(thumbs[0], width1, height1, false, true);
      updateThumb(thumbs[1], width2, height2, true, false, true);
      updateThumb(thumbs[2], width2, height3, true, false, true);
      updateThumb(thumbs[3], width2, height4, true, true, true);
    }
  } else {
    const croppedPhotoRatios = [];

    if(ratioAverage > 1.1) {
      for(const ratio of photoRatios) {
        croppedPhotoRatios.push(Math.max(1, ratio));
      }
    } else {
      for(const ratio of photoRatios) {
        croppedPhotoRatios.push(Math.min(1, ratio));
      }
    }

    const photosLayoutVariants = {
      [thumbs.length]: [calculateMultiThumbsHeight(croppedPhotoRatios, parentWidth, margin)]
    };

    for(let i = 1; i < thumbs.length; i++) {
      photosLayoutVariants[`${i},${thumbs.length-i}`] = [
        calculateMultiThumbsHeight(croppedPhotoRatios.slice(0, i), parentWidth, margin),
        calculateMultiThumbsHeight(croppedPhotoRatios.slice(i, croppedPhotoRatios.length), parentWidth, margin)
      ];
    }

    for(let i = 1; i < thumbs.length - 1; i++) {
      for(let j = 1; j < thumbs.length - i; j++) {
        photosLayoutVariants[`${i},${j},${thumbs.length-i-j}`] = [
          calculateMultiThumbsHeight(croppedPhotoRatios.slice(0, i), parentWidth, margin),
          calculateMultiThumbsHeight(croppedPhotoRatios.slice(i, i + j), parentWidth, margin),
          calculateMultiThumbsHeight(croppedPhotoRatios.slice(i + j, croppedPhotoRatios.length), parentWidth, margin)
        ];
      }
    }

    // Оптимальное расположение фотографий рассчитывается путем
    // нахождения положения фотографий с наименьшей разницей между
    // высотой родилетя и высотой своей сетки.
    // Все возможные положения находятся в photosLayoutVariants.
    let optimalPhotosLayout = null;
    let minHeightDiff = 0;

    for(const key in photosLayoutVariants) {
      if(key.split(',').find((count) => count > 4)) continue;
      
      const photosHeight = photosLayoutVariants[key];
      let heightDiff = Math.abs(margin * (photosHeight.length - 1) + getArraySum(photosHeight) - parentHeight);

      if(key.indexOf(',') != -1) {
        const itemsInRow = key.split(',');

        if(itemsInRow[0] > itemsInRow[1] || itemsInRow.length > 2 && itemsInRow[1] > itemsInRow[2]) {
          heightDiff *= 1.1;
        }
      }

      if(!optimalPhotosLayout || heightDiff < minHeightDiff) {
        optimalPhotosLayout = key;
        minHeightDiff = heightDiff;
      }
    }

    const thumbsCopy = thumbs.slice();
    const photosInRowArr = optimalPhotosLayout.split(',');
    const rowsHeight = photosLayoutVariants[optimalPhotosLayout];
    let rowIndex = 0;

    for(let i = 0; i < photosInRowArr.length; i++) {
      const photosInRow = photosInRowArr[i];
      const photos = thumbsCopy.splice(0, photosInRow);
      const rowHeight = rowsHeight[rowIndex++];

      for(let j = 0; j < photos.length; j++) {
        const width = croppedPhotoRatios.splice(0, 1)[0] * rowHeight;
        const height = rowHeight;
        const lastColumn = photos.length-1 == j;
        const lastRow = photosInRowArr.length-1 == i;

        updateThumb(photos[j], width, height, lastColumn, lastRow);
      }
    }
  }

  return thumbs;
}
