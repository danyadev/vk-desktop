<script>
import { h, Fragment, computed } from 'vue';
import { emojiRegex, generateEmojiImageVNode } from 'js/emoji';
import { createParser } from 'js/utils';
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
            onClick(event) {
              console.log('click', event);
              console.log('link: ' + block.value);
            }
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
      mentionParser(text.value).map((block) => parseBlock(block)[0])
    );
  }
};

const mentionRE = /\[(club|id)(\d+)\|(.+?)\]/g;
const linkRE =
  /(?!(\.|-))(((https?|ftps?):\/\/)?([a-zа-яё0-9.-]+\.([a-zа-яё]{2,18}))(:\d{1,5})?(\/\S*)?)(?=$|\s|[^a-zа-яё0-9])/ig;

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
      id: type === 'id' ? +id : -id,
      value: emojiParser(text, true),
      raw: mentionText
    }];
  }
});
</script>
