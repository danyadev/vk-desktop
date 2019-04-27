import localEmoji from './json/localEmoji.json';

const emojiRegex = /.\u20E3|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;

// TODO добавить возможность добавлять к эмодзи модификаторы, не ломая их
// export const modifiers = {
//   // Цвет
//   light: '🏻',
//   mediumLight: '🏼',
//   medium: '🏽',
//   mediumDark: '🏾',
//   dark: '🏿',
//   // Пол
//   female: '♀️',
//   male: '♂️',
//   // Символ, который нужен для "склеивания" эмодзи
//   separator: '🧟‍♀'[2]
// }

// Преобразует эмодзи символ в hex-код
export function getEmojiCode(emoji) {
  return encodeURIComponent(emoji).replace(/%/g, '').toLowerCase();
}

export function getEmojiFromCode(rawCode) {
  // isKeyCap = true только в случаях с эмодзи "1⃣".
  // Его код - ?e283a3, где ? - это символы 0-9, # и *
  let isKeyCap = rawCode.length % 2 == 1,
      start = isKeyCap ? rawCode.slice(0, 1) : '',
      code = isKeyCap ? rawCode.slice(1) : rawCode;

  return start + decodeURIComponent('%' + code.match(/(..?)/g).join('%'));
}

function parseLocalEmoji(data) {
  return data.split('|').map((n) => {
    const nums = [
      288, 0, 5, 128, 7, 6, 160, 64, 96, 208, 112, 80,
      16, 192, 48, 4, 176, 32, 224, 144, 256, 240, 2, 1, 3, 8
    ];

    if(n === '') return 272;
    else return nums[n];
  });
}

// Генерирует из эмодзи картинку
export function generateEmojiImage(emoji) {
  const local = localEmoji[emoji];
  let props = '';

  if(local) {
    let [id, x, y, posX, posY] = parseLocalEmoji(local),
        style = `background: url('assets/emoji_sprites/sprite_${id}.png') -${x}px -${y}px`;

    if(devicePixelRatio >= 2) style += ` / ${posX}px ${posY}px;`;

    props = `src="assets/blank.gif" style="${style}"`;
  } else {
    props = `src="https://vk.com/emoji/e/${getEmojiCode(emoji)}.png"`;
  }

  return `<img class="emoji" ${props} alt="${emoji}">`;
}

// Преобразует текст с эмодзи символами в текст с эмодзи картинками
export default function(text = '') {
  return text.replace(/&nbsp;/g, ' ').replace(/\uFE0F/g, '')
             .replace(emojiRegex, generateEmojiImage);
}
