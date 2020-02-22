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

function setMaxRatioDiff(ratios, max) {
  let minRatio = ratios[0],
      maxRatio = 0,
      index = 0;

  for(let i = 0; i < ratios.length; i++) {
    const ratio = ratios[i];

    if(ratio < minRatio) {
      minRatio = ratio;
    }

    if(ratio > maxRatio) {
      maxRatio = ratio;
      index = i;
    }
  }

  if(maxRatio / minRatio > max) {
    ratios[index] = max * minRatio;
    setMaxRatioDiff(ratios, max);
  }
}

function updateThumb(thumb, width, height, lastColumn, lastRow, columnItem) {
  thumb.width = width;
  thumb.height = columnItem ? height : Math.max(height, 60);
  if(lastColumn) thumb.lastColumn = lastColumn;
  if(lastRow) thumb.lastRow = lastRow;
  if(columnItem) thumb.columnItem = columnItem;
}

// thumbs = [{ width, height, ...rest }]: массив фоток
// margin: расстояние между фотками
// maxWidth, maxHeight: максимальные размеры родителя
export default function({ thumbs, margin, maxWidth, maxHeight }) {
  // Копируем массив для предотвращения мутации оригинального массива
  thumbs = thumbs.map((thumb) => Object.assign({}, thumb));
  maxHeight = Math.min(maxHeight * .95, 500);

  const photoRatios = [];
  let photoRatioTypes = '';
  let photoRatioSum = 0;

  for(const thumb of thumbs) {
    const ratio = thumb.width / thumb.height;

    photoRatioTypes += ratio > 1.2 ? 'w' : (ratio < .8 ? 'n' : 'q');
    photoRatioSum += ratio;
    photoRatios.push(Math.max(ratio, .30));
  }

  const ratioAverage = photoRatioSum / photoRatios.length;
  const parentRatio = maxWidth / maxHeight;

  if(thumbs.length > 1 && thumbs.length < 5) {
    setMaxRatioDiff(photoRatios, 4);
  }

  if(thumbs.length == 1) {
    if(photoRatios[0] > .8) {
      updateThumb(thumbs[0], maxWidth, maxWidth / photoRatios[0], true, true);
    } else {
      updateThumb(thumbs[0], maxHeight * photoRatios[0], maxHeight, true, true);
    }
  } else if(thumbs.length == 2) {
    if(photoRatioTypes == 'ww' && ratioAverage > 1.4 * parentRatio && photoRatios[1] - photoRatios[0] < .2) {
      const width = maxWidth;
      const height = Math.min(maxWidth / photoRatios[0], maxWidth / photoRatios[1], (maxHeight - margin) / 2);

      updateThumb(thumbs[0], width, height, true, false);
      updateThumb(thumbs[1], width, height, true, true);
    } else if(photoRatioTypes == 'ww' || photoRatioTypes == 'qq') {
      const width = (maxWidth - margin) / 2;
      const height = Math.min(width / photoRatios[0], width / photoRatios[1], maxHeight);

      updateThumb(thumbs[0], width, height, false, true);
      updateThumb(thumbs[1], width, height, true, true);
    } else {
      const width1 = (maxWidth - margin) / photoRatios[1] / (1 / photoRatios[0] + 1 / photoRatios[1]);
      const width2 = maxWidth - width1 - margin;
      const height = Math.min(maxHeight, width1 / photoRatios[0], width2 / photoRatios[1]);

      updateThumb(thumbs[0], width1, height, false, true);
      updateThumb(thumbs[1], width2, height, true, true);
    }
  } else if(thumbs.length == 3) {
    if(photoRatioTypes == 'www') {
      const width1 = maxWidth;
      const width2 = (maxWidth - margin) / 2;
      const height1 = Math.min(width1 / photoRatios[0], (maxHeight - margin) * (2 / 3));
      const height2 = Math.min(maxHeight - height1 - margin, width2 / photoRatios[1], width2 / photoRatios[2]);

      updateThumb(thumbs[0], width1, height1, true, false);
      updateThumb(thumbs[1], width2, height2, false, true);
      updateThumb(thumbs[2], width2, height2, true, true);
    } else {
      const height1 = maxHeight;
      const height2 = photoRatios[1] * (maxHeight - margin) / (photoRatios[2] + photoRatios[1]);
      const height3 = maxHeight - height2 - margin;
      const width1 = Math.min(height1 * photoRatios[0], (maxWidth - margin) * .75);
      const width2 = Math.min(maxWidth - width1 - margin, height2 * photoRatios[2], height3 * photoRatios[1]);

      updateThumb(thumbs[0], width1, height1, false, true);
      updateThumb(thumbs[1], width2, height3, true, false, true);
      updateThumb(thumbs[2], width2, height2, true, true, true);
    }
  } else if(thumbs.length == 4) {
    if(photoRatioTypes == 'wwww') {
      const widthModifier = (maxWidth - margin * 2) / (photoRatios[1] + photoRatios[2] + photoRatios[3]);
      const width1 = maxWidth;
      const width2 = widthModifier * photoRatios[1];
      const width3 = widthModifier * photoRatios[2];
      const width4 = widthModifier * photoRatios[3];
      const height1 = Math.min(width1 / photoRatios[0], (maxHeight - margin) * (2 / 3));
      const height2 = Math.min(maxHeight - height1 - margin, widthModifier);

      updateThumb(thumbs[0], width1, height1, true, false);
      updateThumb(thumbs[1], width2, height2, false, true);
      updateThumb(thumbs[2], width3, height2, false, true);
      updateThumb(thumbs[3], width4, height2, true, true);
    } else {
      const heightModifier = (maxHeight - margin * 2) / (1 / photoRatios[1] + 1 / photoRatios[2] + 1 / photoRatios[3]);
      const height1 = maxHeight;
      const height2 = heightModifier / photoRatios[1];
      const height3 = heightModifier / photoRatios[2];
      const height4 = heightModifier / photoRatios[3];
      const width1 = Math.min(height1 * photoRatios[0], (maxWidth - margin) * (2 / 3));
      const width2 = Math.min(maxWidth - width1 - margin, heightModifier);

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
      [thumbs.length]: [calculateMultiThumbsHeight(croppedPhotoRatios, maxWidth, margin)]
    };

    for(let i = 1; i < thumbs.length; i++) {
      setMaxRatioDiff(croppedPhotoRatios, (i == 4 || thumbs.length-i == 4) ? 2 : 4);

      photosLayoutVariants[`${i},${thumbs.length-i}`] = [
        calculateMultiThumbsHeight(croppedPhotoRatios.slice(0, i), maxWidth, margin),
        calculateMultiThumbsHeight(croppedPhotoRatios.slice(i, thumbs.length), maxWidth, margin)
      ];
    }

    for(let i = 1; i < thumbs.length - 1; i++) {
      for(let j = 1; j < thumbs.length - i; j++) {
        setMaxRatioDiff(croppedPhotoRatios, (i == 4 || j == 4 || thumbs.length-i-j == 4) ? 2 : 4);

        photosLayoutVariants[`${i},${j},${thumbs.length-i-j}`] = [
          calculateMultiThumbsHeight(croppedPhotoRatios.slice(0, i), maxWidth, margin),
          calculateMultiThumbsHeight(croppedPhotoRatios.slice(i, i + j), maxWidth, margin),
          calculateMultiThumbsHeight(croppedPhotoRatios.slice(i + j, thumbs.length), maxWidth, margin)
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
      const heightDiff = Math.abs(margin * (photosHeight.length - 1) + getArraySum(photosHeight) - maxHeight);

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
