<script>
import { h, Fragment, computed, nextTick } from 'vue';
import electron from 'electron';
import { createParser, unescape } from 'js/utils';
import { emojiRegex, generateEmojiImageVNode } from 'js/emoji';
import store from 'js/store';
import domains from 'js/json/domains.json';

export default {
  props: {
    // Заменять ли <br> на пробел, чтобы получить однострочный текст
    inline: {
      type: Boolean,
      default: true
    },
    // Парсить ли ссылки и хештеги
    link: {
      type: Boolean
    },
    // Отображать ли информацию о странице при наведении на упоминание
    // + Дополнительный проп для создания "кликабельных" меншнов?
    mention: {
      type: Boolean
    }
  },

  setup(props, { slots }) {
    const text = computed(() => slots.default()[0].children);

    function parseBlock(block) {
      if (block.type === 'mention') {
        if (props.mention) {
          const mentionContent = block.value.reduce((blocks, mentionTextBlock) => {
            return [...blocks, ...parseBlock(mentionTextBlock)];
          }, []);

          return mentionContent;
        }

        return [block.raw];
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
            onClick: () => electron.shell.openItem(block.link)
          }, [block.value])
        ];
      }

      if (block.type === 'hashtag' && props.link) {
        return [
          h('div', {
            class: 'link',
            async onClick() {
              store.state.messages.isMessagesSearch = true;

              await nextTick();

              const input = document.querySelector('.im_chat_search_input');
              input.value = block.value;
              input.dispatchEvent(new Event('input'));
            }
          }, [block.value])
        ];
      }

      return [block.value];
    }

    return () => h(
      Fragment,
      mentionParser(unescape(text.value)).reduce((blocks, block) => {
        blocks.push(...parseBlock(block));
        return blocks;
      }, [])
    );
  }
};

const mentionRE = /\[(club|id)(\d+)\|(.+?)\]/g;
const linkRE =
  /(?!\.|-)((https?:\/\/)?([a-zа-яё0-9.\-@]+\.([a-zа-яё]{2,18})|(?<localhost>(?<![a-zа-яё0-9])localhost)|(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(?<port>:\d{1,5})?(\/(\S*[^.,!?()"';\n ])?)?)(?=$|\s|[^a-zа-яё0-9])/ig;

const hashtagParser = createParser({
  regexp: /#[a-zа-яё0-9_]+/ig,
  parseText: (value) => [{ type: 'text', value }],
  parseElement: (value) => [{ type: 'hashtag', value }]
});

const linkParser = createParser({
  regexp: linkRE,
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

    // Удаляем из ссылки все, что находится после ) или "
    // чтобы не ломать отображение ссылок в сжатом JSON или при закрытии скобки
    const removeTextMatch = value.match(/((?:\)|").+)/);
    let textAfterLink;

    if (removeTextMatch) {
      // eslint-disable-next-line prefer-destructuring
      textAfterLink = removeTextMatch[1];
      value = value.replace(textAfterLink, '');
    }

    let decodedUri = value;

    try {
      decodedUri = decodeURI(value);
    } catch (err) {
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
  regexp: mentionRE,
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
