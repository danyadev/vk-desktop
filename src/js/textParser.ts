import { emojiRegex } from 'js/emoji';
import domains from 'js/json/domains.json';

interface CreateParserParams<ParseTextType, ParseElementType> {
  regexp: RegExp
  parseText(value: string, ...args: any[]): ParseTextType[]
  parseElement(value: string, match: RegExpMatchArray, ...args: any[]): ParseElementType[]
}

export function createParser<ParseTextType, ParseElementType>(
  { regexp, parseText, parseElement }: CreateParserParams<ParseTextType, ParseElementType>
) {
  return function(text: string, ...args: any[]) {
    const blocks: (ParseTextType | ParseElementType)[] = [];
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

interface ParserReturnType<Type> {
  type: Type,
  value: string
}

type TextType = ParserReturnType<'text'>;
type HashtagElementType = TextType | ParserReturnType<'hashtag'>;

export const hashtagParser = createParser<TextType, HashtagElementType>({
  regexp: /#[a-zа-яё0-9_]+/ig,
  parseText: (value) => [{ type: 'text', value }],
  parseElement: (value, match, isMention = false) => [
    { type: isMention ? 'text' : 'hashtag', value }
  ]
});

type LinkTextType = TextType | HashtagElementType;
type LinkElementType = ParserReturnType<'link'> & { link: string };

export const linkParser = createParser<LinkTextType, TextType | LinkElementType>({
  regexp: /(?!\.)((https?:\/\/)?([a-zа-яё0-9.\-@]+\.([a-zа-яё]{2,18})|(?<localhost>(?<![a-zа-яё0-9])localhost)|(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(?<port>:\d{1,5})?(\/(\S*[^.,!?()"';\n ])?)?)(?=$|\s|[^a-zа-яё0-9])/ig,
  parseText: hashtagParser,
  parseElement(value, match, isMention = false) {
    const { localhost, port, ip } = match.groups;
    const isValidIP = !ip || !ip.split('.').find((v) => +v > 255);
    const isValidPort = !port || +port.slice(1) < 65536;
    const domain = match[4] && match[4].toLowerCase();
    const isValidDomain = isValidIP && isValidPort && (ip || localhost || domains.includes(domain));

    if (isMention || !isValidDomain || match[3] && match[3].includes('@')) {
      return [{ type: 'text', value }];
    }

    // Удаляем из ссылки все, что находится после ) или ",
    // чтобы не ломать отображение ссылок в сжатом JSON или при закрытии скобки
    const removeTextMatch = value.match(/((?:[)"]).+)/);
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

type BrTextType = LinkTextType | LinkElementType;
type BrElementType = { type: 'br' };

export const brParser = createParser<BrTextType, BrElementType>({
  regexp: /<br>/g,
  parseText: linkParser,
  parseElement: () => [{ type: 'br' }]
});

type EmojiTextType = BrTextType | BrElementType;
type EmojiElementType = ParserReturnType<'emoji'>

export const emojiParser = createParser<EmojiTextType, EmojiElementType>({
  regexp: emojiRegex,
  parseText: brParser,
  parseElement: (value) => [{ type: 'emoji', value }]
});

type MentionTextType = EmojiTextType | EmojiElementType;
interface MentionElementType {
  type: 'mention',
  value: ReturnType<typeof emojiParser>,
  id: number,
  raw: string
}

export const mentionParser = createParser<MentionTextType, MentionElementType>({
  regexp: /\[(club|id)(\d+)\|(.+?)\]/g,
  parseText: emojiParser,
  parseElement(mentionText, match) {
    const [, type, id, text] = match;

    return [{
      type: 'mention',
      id: type === 'id' ? +id : -id,
      raw: mentionText,
      value: emojiParser(text, true)
    }];
  }
});
