<script>
import electron from 'electron';
import { h, Fragment, computed } from 'vue';
import { emojiRegex, generateEmojiImageVNode } from 'js/emoji';
import { createParser, unescape } from 'js/utils';
import domains from 'js/json/domains.json';

export default {
  props: {
    // Заменять ли <br> на пробел, чтобы получить однострочный текст
    inline: {
      type: Boolean,
      default: true
    },
    // Парсить ли ссылки
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
      const elements = [];

      if (block.type === 'link' && props.link) {
        elements.push(
          h('div', {
            class: 'link',
            onClick: () => electron.shell.openItem(block.link)
          }, [block.value])
        );
      } else if (block.type === 'mention') {
        if (props.mention) {
          // TODO элемент, при наведении на который отображать информацию о юзере
          const mentionContent = block.value.reduce((blocks, mentionTextBlock) => {
            blocks.push(...parseBlock(mentionTextBlock));
            return blocks;
          }, []);

          elements.push(...mentionContent);
        } else {
          elements.push(block.raw);
        }
      } else if (block.type === 'emoji') {
        elements.push(generateEmojiImageVNode(h, block.value));
      } else if (block.type === 'br') {
        elements.push(props.inline ? ' ' : h('br'));
      } else {
        elements.push(block.value);
      }

      return elements;
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
  /(?!\.|-)((https?:\/\/)?([a-zа-яё0-9.\-@]+\.([a-zа-яё]{2,18})|(?<localhost>(?<![a-zа-яё0-9])localhost)|(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(?<port>:\d{1,5})?(\/(\S*(?<!\))[^.,!?();\n ])?)?)(?=$|\s|[^a-zа-яё0-9])/ig;

const linkParser = createParser({
  regexp: linkRE,
  parseText: (value) => [{ type: 'text', value }],
  parseElement(value, match, isMention) {
    const { localhost, port, ip } = match.groups;
    const isValidIP = !ip || !ip.split('.').find((v) => v > 255);
    const isValidPort = !port || port.slice(1) <= 65535;
    const domain = match[4] && match[4].toLowerCase();
    const isValidDomain = isValidIP && isValidPort && (ip || localhost || domains.includes(domain));

    if (isMention || !isValidDomain || match[3] && match[3].includes('@')) {
      return [{ type: 'text', value }];
    }

    return [{
      type: 'link',
      value: decodeURI(value).replace(/(.{55}).+/, '$1..'),
      link: (match[2] ? '' : 'http://') + value
    }];
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
