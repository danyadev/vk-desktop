<script>
import { h, Fragment, computed, nextTick } from 'vue';
import electron from 'electron';
import { createParser, unescape, eventBus } from 'js/utils';
import { emojiRegex, generateEmojiImageVNode } from 'js/emoji';
import vkapi from 'js/vkapi';
import store from 'js/store';
import router from 'js/router';
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
          const mentionContent = block.value.reduce((blocks, mentionTextBlock) => (
            [...blocks, ...parseBlock(mentionTextBlock)]
          ), []);

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
            async onClick() {
              const url = new URL(block.link);
              const params = new Map(url.searchParams);
              const route = router.currentRoute.value;

              async function openChat(peer_id) {
                if (route.name === 'chat') {
                  eventBus.emit('messages:event', 'closeChat', {
                    peer_id: route.params.id
                  });

                  // TODO remove
                  await router.replace('/messages');
                }

                router.replace(`/messages/${peer_id}`);
              }

              if (url.host === 'm.vk.com') {
                if (params.get('act') === 'show') {
                  if (params.has('chat')) {
                    return openChat(2e9 + +params.get('chat'));
                  }

                  if (params.has('peer')) {
                    return openChat(+params.get('peer'));
                  }
                }

                if (url.pathname.startsWith('/write')) {
                  return openChat(+url.pathname.slice(6));
                }
              }

              if (url.host === 'vk.com') {
                if (url.pathname === '/im' && params.has('sel')) {
                  const sel = params.get('sel');

                  if (sel.startsWith('c')) {
                    return openChat(2e9 + +sel.slice(1));
                  }

                  return openChat(+sel);
                }

                if (url.pathname.startsWith('/write')) {
                  return openChat(+url.pathname.slice(6));
                }
              }

              if (url.host === 'vk.me') {
                // if (url.pathname.startsWith('/join/') && url.pathname.length > 6) {
                //   TODO chat preview
                //   vkapi messages.getChatPreview link: block.link
                // }

                const domain = url.pathname.slice(1);

                if (!domain.includes('/')) {
                  const idMatch = domain.match(/(id|club)(\d+)$/);

                  if (idMatch) {
                    return openChat(idMatch[1] === 'id' ? +idMatch[2] : -idMatch[2]);
                  }

                  const localProfile = Object.values(store.state.profiles).find((profile) => (
                    profile.domain === domain || profile.screen_name === domain
                  ));

                  if (localProfile) {
                    return openChat(localProfile.id);
                  }

                  const profileInfo = await vkapi('utils.resolveScreenName', {
                    screen_name: domain
                  });

                  // В случае, когда домен неверный, приходит []
                  if (!Array.isArray(profileInfo)) {
                    if (profileInfo.type === 'user') {
                      return openChat(+profileInfo.object_id);
                    }

                    if (profileInfo.type === 'group') {
                      return openChat(-profileInfo.object_id);
                    }
                  }
                }
              }

              electron.shell.openItem(block.link);
            }
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

const hashtagParser = createParser({
  regexp: /#[a-zа-яё0-9_]+/ig,
  parseText: (value) => [{ type: 'text', value }],
  parseElement: (value) => [{ type: 'hashtag', value }]
});

const linkParser = createParser({
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
</script>
