import { emojiRegex } from 'js/emoji';
import domains from 'js/json/domains.json';

// Создает парсер текста, который делит текст на блоки с помощью регулярки.
// parseText вызывается если кусок текста не входит в регулярку
// parseText(value (кусок текста), ...args (параметры, переданные в экземпляр парсера)) {}
// parseElement вызывается если кусок текста уже входит в регулярку
// parseElement(value, match (вывод регулярки), ...args) {}
// Эти функции обязательны и должны вернуть массив, который затем добавится к ответу
// Пример:
// const parser = createParser({
//   regexp: /element/g,
//   parseText: (value, ...args) => [{ type: 'text', value }],
//   parseElement: (value, match, ...args) => [{ type: 'el', value }]
// });
// const result = parser('text element', 'arg1', 'arg2');
// result = [{ type: 'text', value: 'text ' }, { type: 'el', value: 'element' }];
export function createParser({ regexp, parseText, parseElement }) {
  return function(text, ...args) {
    const blocks = [];
    let offset = 0;

    for (const match of text.matchAll(regexp)) {
      const { 0: result, index } = match;

      if (index !== offset) {
        blocks.push(...parseText(text.slice(offset, index), ...args));
      }

      blocks.push(...parseElement(result, match, ...args));

      offset = index + result.length;
    }

    if (text.length !== offset) {
      blocks.push(...parseText(text.slice(offset, text.length), ...args));
    }

    return blocks;
  };
}

export const hashtagParser = createParser({
  regexp: /#[a-zа-яё0-9_]+/ig,
  parseText: (value) => [{ type: 'text', value }],
  parseElement: (value) => [{ type: 'hashtag', value }]
});

export const linkParser = createParser({
  regexp: /(?!\.|-)((https?:\/\/)?([a-zа-яё0-9.\-@]+\.([a-zа-яё]{2,18})|(?<localhost>(?<![a-zа-яё0-9])localhost)|(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(?<port>:\d{1,5})?(\/(\S*[^.,!?()"';\n ])?)?)(?=$|\s|[^a-zа-яё0-9])/ig,
  parseText: hashtagParser,
  parseElement(value, match, isMention) {
    const { localhost, port, ip } = match.groups;
    const isValidIP = !ip || !ip.split('.').find((v) => v > 255);
    const isValidPort = !port || port.slice(1) <= 65535;
    const domain = match[4] && match[4].toLowerCase();
    const isValidDomain = isValidIP && isValidPort && (ip || localhost || domains.includes(domain));

    if (isMention || !isValidDomain || match[3] && match[3].includes('@')) {
      return [{ type: 'text', value }];
    }

    // Удаляем из ссылки все, что находится после ) или ",
    // чтобы не ломать отображение ссылок в сжатом JSON или при закрытии скобки
    const removeTextMatch = value.match(/((?:\)|").+)/);
    let textAfterLink;

    if (removeTextMatch) {
      textAfterLink = removeTextMatch[1];
      value = value.replace(textAfterLink, '');
    }

    let decodedUri = value;

    try {
      decodedUri = decodeURI(value);
    } catch {
      // Попалась ссылка со сломанным закодированным текстом
    }

    return [
      {
        type: 'link',
        value: decodedUri.replace(/(.{55}).+/, '$1..'),
        link: (match[2] ? '' : 'http://') + value
      },
      ...(textAfterLink ? linkParser(textAfterLink) : [])
    ];
  }
});

export const brParser = createParser({
  regexp: /<br>/g,
  parseText: linkParser,
  parseElement: () => [{ type: 'br' }]
});

export const emojiParser = createParser({
  regexp: emojiRegex,
  parseText: brParser,
  parseElement: (value) => [{ type: 'emoji', value }]
});

export const mentionParser = createParser({
  regexp: /\[(club|id)(\d+)\|(.+?)\]/g,
  parseText: emojiParser,
  parseElement(mentionText, match) {
    const [, type, id, text] = match;

    return [{
      type: 'mention',
      value: emojiParser(text, true),
      id: type === 'id' ? +id : -id,
      raw: mentionText
    }];
  }
});
