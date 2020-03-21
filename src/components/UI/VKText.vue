<script>
import { h, Fragment } from 'vue';
import { emojiRegex, generateEmojiImageVNode } from 'js/emoji';
import domains from 'js/json/domains.json';

export default {
  props: {
    // Заменять ли <br> на пробел, чтобы получить однострочный текст
    inline: { default: false },
    // Парсить ли ссылки
    link: { default: false },
    // Отображать ли информацию о странице при наведении на упоминание
    mention: { default: false }
  },

  setup(props, { slots }) {
    const [{ children: text }] = slots.default();
    const children = [];

    function parseBlock(block) {
      const elements = [];

      if (block.type === 'link' && props.link) {
        elements.push(
          h('div', {
            class: 'link',
            onClick(event) {
              console.log('click', event);
              console.log('link: ' + block.value);
            }
          }, [block.value])
        );
      } else if (block.type === 'mention') {
        // TODO элемент, при наведении на который отображать информацию о юзере
        elements.push(
          ...block.value.reduce((blocks, mentionTextBlock) => {
            blocks.push(...parseBlock(mentionTextBlock));
            return blocks;
          }, [])
        );
      } else if (block.type === 'emoji') {
        elements.push(generateEmojiImageVNode(h, block.value));
      } else {
        if (props.inline) {
          block.value = block.value.replace(/<br>/g, ' ');
        }

        elements.push(h(Fragment, [block.value]));
      }

      return elements;
    }

    return () => h(
      Fragment,
      mentionParser(text).map((block) => parseBlock(block)[0])
    );
  }
};

const mentionRE = /\[(club|id)(\d+)\|(.+?)\]/g;
const linkRE =
  /(?!(\.|-))(((https?|ftps?):\/\/)?([a-zа-яё0-9.-]+\.([a-zа-яё]{2,18}))(:\d{1,5})?(\/\S*)?)(?=$|\s|[^a-zа-яё0-9])/ig;

function createParser({ regexp, parseText, parseElement }) {
  return function(text, isMention) {
    const blocks = [];
    let match;
    let offset = 0;

    while ((match = regexp.exec(text))) {
      const len = match[0].length;

      if (offset !== match.index) {
        blocks.push(...parseText(text.slice(offset, match.index), isMention));
      }

      offset = match.index + len;

      blocks.push(...parseElement(text.slice(match.index, offset), match, isMention));
    }

    if (offset !== text.length) {
      blocks.push(...parseText(text.slice(offset, text.length), isMention));
    }

    return blocks;
  };
}

const linkParser = createParser({
  regexp: linkRE,
  parseText: (value) => [{ type: 'text', value }],
  parseElement(value, match, isMention) {
    const domain = match[6];
    const isValidDomain = domains.includes(domain);

    if (isMention || !isValidDomain) {
      return [{ type: 'text', value }];
    }

    return [{ type: 'link', value }];
  }
});

const emojiParser = createParser({
  regexp: emojiRegex,
  parseText: linkParser,
  parseElement: (value) => [{ type: 'emoji', value }]
});

const mentionParser = createParser({
  regexp: mentionRE,
  parseText: emojiParser,
  parseElement(mentionText, match) {
    const [, type, id, text] = match;

    return [{
      type: 'mention',
      id: type === 'club' ? -id : +id,
      value: emojiParser(text, true)
    }];
  }
});
</script>
