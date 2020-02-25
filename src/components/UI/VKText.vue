<script>
  import domains from 'js/json/domains.json';
  import { emojiRegex, generateEmojiImageVNode } from 'js/emoji';

  const mentionRE = /\[(club|id)(\d+)\|(.+?)\]/g;
  const linkRE =
    /(?!(\.|\-))(((https?|ftps?):\/\/)?([a-zа-яё0-9\.\-]+\.([a-zа-яё]{2,18}))(:\d{1,5})?(\/\S*)?)(?=$|\s|[^a-zа-яё0-9])/ig;

  function createParser({ regexp, parseText, parseElement }) {
    return function(text, isMention) {
      const blocks = [];
      let match;
      let offset = 0;

      while(match = regexp.exec(text)) {
        const len = match[0].length;

        if(match.index != offset) {
          blocks.push(...parseText(text.slice(offset, match.index), isMention));
        }

        offset = match.index + len;

        blocks.push(...parseElement(text.slice(match.index, offset), match, isMention));
      }

      if(offset != text.length) {
        blocks.push(...parseText(text.slice(offset, text.length), isMention));
      }

      return blocks;
    }
  }

  const parseLink = createParser({
    regexp: linkRE,
    parseText: (value) => [{ type: 'text', value }],
    parseElement(value, match, isMention) {
      const domain = match[6];
      const isValidDomain = domains.includes(domain);

      if(isMention || !isValidDomain) return [{ type: 'text', value }];
      else return [{ type: 'link', value }];
    }
  });

  const parseEmoji = createParser({
    regexp: emojiRegex,
    parseText: parseLink,
    parseElement: (value) => [{ type: 'emoji', value }]
  });

  const parseMention = createParser({
    regexp: mentionRE,
    parseText: parseEmoji,
    parseElement(mentionText, match) {
      const [, type, id, text] = match;

      return [{
        type: 'mention',
        id: type == 'club' ? -id : +id,
        value: parseEmoji(text, true)
      }];
    }
  });

  export default {
    props: {
      // Заменять ли <br> на пробел, чтобы получить однострочный текст
      inline: { default: false },
      // Парсить ли ссылки
      link: { default: true },
      // Отображать ли информацию о странице при наведении на упоминание
      mention: { default: true }
    },

    render(h, props) {
      const text = this.$slots.default[0].text;
      const children = [];

      const parseBlock = (block) => {
        const elements = [];

        if(block.type == 'link' && this.link) {
          // TODO <a />
          elements.push(block.value);
        } else if(block.type == 'mention') {
            // TODO элемент, при наведении на который отображать информацию о юзере
          elements.push(...block.value.reduce((blocks, block) => {
            blocks.push(...parseBlock(block));
            return blocks;
          }, []));
        } else if(block.type == 'emoji') {
          elements.push(generateEmojiImageVNode(h, block.value));
        } else {
          if(this.inline) block.value = block.value.replace(/<br>/g, ' ');

          elements.push(block.value);
        }

        return elements;
      }

      for(const block of parseMention(text)) {
        children.push(...parseBlock(block));
      }

      return h('span', children);
    }
  }
</script>

<style>

</style>
