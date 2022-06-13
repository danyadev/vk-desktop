<script>
import { loadProfile, createParser, getPhotoFromSizes } from 'js/utils';
import store from 'js/store';
import getTranslate from 'js/getTranslate';

import VKText from '@/UI/VKText.vue';

export default {
  props: ['msg', 'author', 'isFull'],

  setup(props) {
    return () => getServiceMessage(
      props.msg,
      props.author || { id: props.msg.from },
      props.isFull
    );
  }
};

const translateParser = createParser({
  regexp: /{(\d)}/g,
  parseText: (value) => [value],
  parseElement(value, match, replaces) {
    const id = match[1];
    const text = replaces[id];

    return [
      <b key={text}>
        <VKText>{text}</VKText>
      </b>
    ];
  }
});

function getVNode(name, key, replaces, photo) {
  const translate = getTranslate(name, key);
  const message = <span>{translateParser(translate, replaces)}</span>;

  return <>{message}{photo}</>;
}

function getServiceMessage(msg, author, isFull) {
  const actID = msg.action.member_id;
  const actUser = store.state.profiles[actID] || { id: actID };
  const { activeUserID } = store.state.users;
  const isAuthor = actID === author.id;

  // Возвращает индекс для массива определенного перевода
  function type(isActionUser) {
    const user = isActionUser ? actUser : author;

    // Вы / Вас
    if (user.id === activeUserID) {
      return 0;
    }

    return user.sex === 1
      ? 2 // Женский пол
      : 1; // Мужской пол
  }

  function name(isActionUser, isAccCase) {
    const user = isActionUser ? actUser : author;

    if (user.id === activeUserID) {
      return isAccCase ? getTranslate('you2') : getTranslate('you');
    } else if (user.name) {
      return user.name;
    } else if (user.first_name) {
      return isAccCase
        ? `${user.first_name_acc} ${user.last_name_acc}`
        : `${user.first_name} ${user.last_name}`;
    }

    loadProfile(user.id);

    return '...';
  }

  switch (msg.action.type) {
    case 'chat_create':
      return getVNode('im_chat_create', type(0), [name(0), msg.action.text]);

    case 'chat_photo_update':
      const photoAttaches = msg.attachments.photo;
      let photo;

      if (isFull && photoAttaches) {
        photo = <img
          class="service_message_photo"
          src={getPhotoFromSizes(photoAttaches[0].sizes, 'p').url}
        />;
      }

      return getVNode('im_chat_photo_update', type(0), [name(0)], photo);

    case 'chat_photo_remove':
      return getVNode('im_chat_photo_remove', type(0), [name(0)]);

    case 'chat_title_update':
      return getVNode(
        'im_chat_title_update',
        type(0),
        [name(0), msg.action.old_text, msg.action.text]
      );

    case 'chat_pin_message':
      // Сообщение может не содержать текста (например, если в нем только вложения)
      if (msg.action.message) {
        return getVNode('im_chat_pin_message', type(1), [name(1), msg.action.message]);
      } else {
        return getVNode('im_chat_pin_empty_message', type(1), [name(1)]);
      }

    case 'chat_unpin_message':
      return getVNode('im_chat_unpin_message', type(1), [name(1)]);

    case 'chat_invite_user':
      if (isAuthor) {
        return getVNode('im_chat_returned_user', type(0), [name(0)]);
      } else if (isFull) {
        return getVNode('im_chat_invite_user', type(0), [name(0), name(1, 1)]);
      } else {
        return getVNode('im_chat_invite_user_short', type(1), [name(1, 1)]);
      }

    case 'chat_invite_user_by_link':
      return getVNode('im_chat_invite_user_by_link', type(0), [name(0)]);

    case 'chat_kick_user':
      if (isAuthor) {
        return getVNode('im_chat_left_user', type(0), [name(0)]);
      } else if (isFull) {
        return getVNode('im_chat_kick_user', type(0), [name(0), name(1, 1)]);
      } else {
        return getVNode('im_chat_kick_user_short', type(1), [name(1, 1)]);
      }

    case 'chat_kick_don':
      return getVNode('im_chat_kick_don', null, [name(0)]);

    case 'chat_screenshot':
      return getVNode('im_chat_screenshot', type(0), [name(0)]);

    case 'chat_group_call_started':
      return getVNode('im_chat_group_call_started', type(0), [name(0)]);

    case 'chat_invite_user_by_call':
      return getVNode('im_chat_invite_user_by_call', type(0), [name(0), name(1, 1)]);

    case 'chat_invite_user_by_call_join_link':
      return getVNode('im_chat_invite_user_by_call_join_link', type(0), [name(0)]);

    case 'conversation_style_update':
      if (msg.action.style) {
        return getVNode(
          'im_conversation_style_update',
          type(0),
          [name(0), getTranslate('im_chat_themes', msg.action.style)]
        );
      } else {
        return getVNode('im_conversation_style_reset', type(0), [name(0)]);
      }

    default:
      console.warn('[im] Неизвестное действие:', msg.action.type);
      return msg.action.type;
  }
}
</script>

<style>
.service_message_photo {
  width: 100px;
  height: 100px;
  margin-top: 10px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--background-black-alpha);
  /* cursor: pointer; */
}
</style>
