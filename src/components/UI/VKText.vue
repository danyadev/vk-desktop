<script>
import { computed } from 'vue';
import electron from 'electron';
import { createParser, unescape } from 'js/utils';
import { isUserId, convertGroupIdToOwnerId } from 'js/api/ranges';
import { emojiRegex, generateEmojiImageVNode } from 'js/emoji';
import store from 'js/store';
import internalLinkResolver from 'js/internalLinkResolver';
import domains from 'js/json/domains.json';

export default {
  props: {
    // true - оставляет переносы строк, false (по умолчанию) - удаляет переносы строк
    multiline: Boolean,
    // Парсит ссылки и хештеги
    link: Boolean,
    // Парсит упоминания
    mention: Boolean,
    // Выделяет ссылки, хештеги и упоминания синим цветом, но не делает их кликабельными
    preview: Boolean
  },

  setup(props, { slots }) {
    const text = computed(() => slots.default()[0].children);
    const useNativeEmoji = computed(() => store.getters['settings/settings'].useNativeEmoji);

    function parseBlock(block) {
      if (block.type === 'mention') {
        if (!props.mention && !props.preview) {
          return block.raw;
        }

        const mentionContent = block.value.reduce((blocks, mentionTextBlock) => (
          [...blocks, ...parseBlock(mentionTextBlock)]
        ), []);

        if (props.mention) {
          return (
            <div
              class="link"
              onClick={() => {
                const path = isUserId(block.id)
                  ? `id${block.id}`
                  : `club${convertGroupIdToOwnerId(block.id)}`;

                electron.shell.openExternal(`https://vk.com/${path}`);
              }}
            >
              {mentionContent}
            </div>
          );
        }

        return <div class="message_preview">{mentionContent}</div>;
      }

      if (block.type === 'emoji') {
        return useNativeEmoji.value
          ? block.value
          : generateEmojiImageVNode(block.value);
      }

      if (block.type === 'br') {
        return props.multiline ? <br /> : ' ';
      }

      if (block.type === 'link' && (props.link || props.preview)) {
        if (props.preview) {
          return <div class="message_preview">{block.preview}</div>;
        }

        return (
          <div class="link" title={block.preview} onClick={() => internalLinkResolver(block.link)}>
            {block.preview.replace(/(.{55}).+/, '$1..')}
          </div>
        );
      }

      if (block.type === 'hashtag' && (props.link || props.preview)) {
        const className = props.link ? 'link' : 'message_preview';

        return <div class={className}>{block.value}</div>;
      }

      if (block.type === 'massMention' && (props.mention || props.preview)) {
        return <div class="message_preview">{block.preview}</div>;
      }

      return block.value;
    }

    return () => {
      const children = mentionParser(unescape(text.value)).reduce((blocks, block) => {
        const blockVNodes = parseBlock(block);

        if (Array.isArray(blockVNodes)) {
          blocks.push(...blockVNodes);
        } else {
          blocks.push(blockVNodes);
        }

        return blocks;
      }, []);

      if (!children.length) {
        children.push('');
      }

      return <>{children}</>;
    };
  }
};

// Хештеги парсятся после масс меншнов потому что #abc@all
// будет упоминать всю беседу, а не игнорировать @all
const hashtagParser = createParser({
  regexp: /#[a-zа-яё0-9_@]+/ig,
  parseText: (value) => [{ type: 'text', value }],
  parseElement: (value, match, isMention) => [{ type: isMention ? 'text' : 'hashtag', value }]
});

const massMentionParser = createParser({
  regexp: /(?:[@*])(?:(all|everyone|все)|(online|here|здесь|тут))/ig,
  parseText: hashtagParser,
  parseElement: (value, match, isMention) => [{
    type: isMention ? 'text' : 'massMention',
    subtype: match[1] ? 'all' : 'online',
    value
  }]
});

const linkParser = createParser({
  regexp: /((https?:\/\/)?([a-zа-яё0-9.\-@_]+\.([a-zа-яё]{2,18})|(?<localhost>(?<![a-zа-яё0-9])localhost)|(?<!\d)(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?!\d))(?<port>:\d{1,5})?(\/(\S*[^.,!?()"';\n\\ ])?)?)(?=$|\s|(?!\.[a-zа-яё0-9])[^a-zа-яё0-9])/ig,
  parseText: massMentionParser,
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
    const removeTextMatch = value.match(/((?:[)"\\]).+)/);
    let textAfterLink;

    if (removeTextMatch) {
      textAfterLink = removeTextMatch[1];
      value = value.replace(textAfterLink, '');
    }

    let decodedUri = value;

    try {
      decodedUri = decodeURIComponent(value);
    } catch {
      // Попалась ссылка со сломанным закодированным текстом
    }

    return [
      {
        type: 'link',
        value,
        preview: decodedUri,
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
      id: type === 'id' ? +id : convertGroupIdToOwnerId(+id),
      raw: mentionText
    }];
  }
});
</script>

<style>
.message_preview {
  display: inline;
  color: var(--text-blue);
}
</style>
