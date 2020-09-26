<script>
import { h, Fragment, computed } from 'vue';
import electron from 'electron';
import { createParser, unescape } from 'js/utils';
import { emojiRegex, generateEmojiImageVNode } from 'js/emoji';
import internalLinkResolver from 'js/internalLinkResolver';
import domains from 'js/json/domains.json';

export default {
  props: {
    // Заменять ли <br> на пробел, чтобы получить однострочный текст
    inline: {
      type: Boolean,
      default: true
    },
    // Парсить ли ссылки и хештеги
    link: Boolean,
    // text - преобразовать упоминание в нормальный вид ([id|text] -> text)
    // attachment - выделить упоминание синим цветом
    // link - выделить синим цветом и сделать кликабельным
    mention: String
  },

  setup(props, { slots }) {
    const text = computed(() => slots.default()[0].children);

    function parseBlock(block) {
      if (block.type === 'mention') {
        if (!props.mention) {
          return [block.raw];
        }

        const mentionContent = block.value.reduce((blocks, mentionTextBlock) => (
          [...blocks, ...parseBlock(mentionTextBlock)]
        ), []);

        if (props.mention === 'text') {
          return mentionContent;
        }

        let attrs;

        if (props.mention === 'link') {
          attrs = {
            class: 'link',
            onClick() {
              const path = block.id > 0 ? `id${block.id}` : `club${-block.id}`;
              electron.shell.openItem(`https://vk.com/${path}`);
            }
          };
        } else {
          attrs = { class: 'mention_attachment' };
        }

        return [h('div', attrs, mentionContent)];
      }

      if (block.type === 'emoji') {
        return [generateEmojiImageVNode(h, block.value)];
      }

      if (block.type === 'br') {
        return [props.inline ? ' ' : h('br')];
      }

      if (block.type === 'link' && props.link) {
        return [
          h('div', {
            class: 'link',
            onClick: () => internalLinkResolver(block.link)
          }, [block.value])
        ];
      }

      if (block.type === 'hashtag' && props.link) {
        return [
          h('div', {
            class: 'link'
            // onClick() {}
          }, [block.value])
        ];
      }

      return [block.value];
    }

    return () => {
      const children = mentionParser(unescape(text.value)).reduce((blocks, block) => {
        blocks.push(...parseBlock(block));
        return blocks;
      }, []);

      if (!children.length) {
        children.push('');
      }

      return h(Fragment, children);
    };
  }
};

const hashtagParser = createParser({
  regexp: /#[a-zа-яё0-9_]+/ig,
  parseText: (value) => [{ type: 'text', value }],
  parseElement: (value) => [{ type: 'hashtag', value }]
});

const linkParser = createParser({
  regexp: /((https?:\/\/)?([a-zа-яё0-9.\-@]+\.([a-zа-яё]{2,18})|(?<localhost>(?<![a-zа-яё0-9])localhost)|(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(?<port>:\d{1,5})?(\/(\S*[^.,!?()"';\n\\ ])?)?)(?=$|\s|[^a-zа-яё0-9])/ig,
  parseText: hashtagParser,
  parseElement(value, match, isMention) {
    const { localhost, port, ip } = match.groups;
    const isValidIP = !ip || !ip.split('.').find((v) => v > 255);
    const isValidPort = !port || port.slice(1) <= 65535;
    const domain = match[4] && match[4].toLowerCase();
    const isValidDomain = isValidIP && isValidPort && (ip || localhost || domains.includes(domain));
    const isInvalidDomainName = match[3].includes('@') || match[3].startsWith('.');

    if (isMention || !isValidDomain || isInvalidDomainName) {
      return [{ type: 'text', value }];
    }

    // Удаляем из ссылки все, что находится после ) или ",
    // чтобы не ломать отображение ссылок в сжатом JSON или при закрытии скобки
    const removeTextMatch = value.match(/((?:\)|"|\\).+)/);
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

const brParser = createParser({
  regexp: /<br>/g,
  parseText: linkParser,
  parseElement: () => [{ type: 'br' }]
});

const emojiParser = createParser({
  regexp: emojiRegex,
  parseText: brParser,
  parseElement: (value) => [{ type: 'emoji', value }]
});

const mentionParser = createParser({
  // public нужен для предварительного отображения сообщения с
  // упоминанием вида [public{xxx}|text]
  regexp: /\[(club|public|id)(\d+)\|(.+?)\]/g,
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
</script>

<style>
.mention_attachment {
  display: inline;
  color: var(--text-blue);
}
</style>
