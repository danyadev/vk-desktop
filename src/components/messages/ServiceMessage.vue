<script>
import { h, computed, Fragment } from 'vue';
import { loadConversationMembers, loadedConvMembers } from 'js/messages';
import { loadProfile, createParser } from 'js/utils';
import getTranslate from 'js/getTranslate';
import store from 'js/store';

export default {
  props: ['msg', 'author', 'peer_id', 'isFull'],

  setup(props) {
    const serviceMessage = computed(() => {
      return getServiceMessage(
        props.msg,
        props.author || { id: props.msg.from },
        props.peer_id,
        props.isFull
      );
    });

    return () => serviceMessage.value;
  }
};

const translateParser = createParser({
  regexp: /{(\d)}/g,
  parseText: (value) => [value],
  parseElement(value, match, replaces) {
    const id = match[1];
    return [h('b', replaces[id])];
  }
});

function getVNode(name, key, replaces) {
  const translate = getTranslate(name, key);
  return h(Fragment, translateParser(translate, replaces));
}

function getServiceMessage(msg, author, peer_id, isFull) {
  const actID = msg.action.member_id || msg.action.mid;
  const actUser = store.state.profiles[actID] || { id: actID };
  const { activeUser: id } = store.state.users;
  const isAuthor = actID === author.id;

  // Возвращает индекс для массива определенного перевода
  function type(isActionUser) {
    const user = isActionUser ? actUser : author;

    // Вы / Вас
    if (user.id === id) {
      return 0;
    }

    return user.sex === 1
      ? 2 // Женский пол
      : 1; // Мужской пол
  }

  function name(isActionUser, isAccCase) {
    const user = isActionUser ? actUser : author;

    if (user.id === id) {
      return isAccCase ? getTranslate('you2') : getTranslate('you');
    } else if (user.name) {
      return user.name;
    } else if (user.first_name) {
      return isAccCase
        ? `${user.first_name_acc} ${user.last_name_acc}`
        : `${user.first_name} ${user.last_name}`;
    }

    if (!loadedConvMembers.has(peer_id)) {
      // В случае, когда юзеры в беседе не загружены
      loadConversationMembers(peer_id);
    } else {
      // При добавлении нового юзера в беседу
      loadProfile(user.id);
    }

    return '...';
  }

  switch (msg.action.type) {
    case 'chat_photo_update':
      return getVNode('im_chat_photo_update', type(0), [name(0)]);

    case 'chat_photo_remove':
      return getVNode('im_chat_photo_remove', type(0), [name(0)]);

    case 'chat_create':
      return getVNode('im_chat_create', type(0), [name(0), msg.action.text]);

    case 'chat_title_update':
      return getVNode('im_chat_title_update', type(0), [name(0), msg.action.text]);

    case 'chat_pin_message':
      if (msg.action.message) {
        return getVNode('im_chat_pin_message', type(1), [name(1), msg.action.message]);
      } else {
        return getVNode('im_chat_pin_empty_message', type(1), [name(1)]);
      }

    case 'chat_unpin_message':
      return getVNode('im_chat_unpin_message', type(1), [name(1)]);

    case 'chat_invite_user_by_link':
      return getVNode('im_chat_invite_user_by_link', type(0), [name(0)]);

    case 'chat_invite_user':
      if (isAuthor) {
        return getVNode('im_chat_returned_user', type(0), [name(0)]);
      } else if (isFull) {
        return getVNode('im_chat_invite_user', type(0), [name(0), name(1, 1)]);
      } else {
        return getVNode('im_chat_invite_user_short', type(1), [name(1, 1)]);
      }

    case 'chat_kick_user':
      if (isAuthor) {
        return getVNode('im_chat_left_user', type(0), [name(0)]);
      } else if (isFull) {
        return getVNode('im_chat_kick_user', type(0), [name(0), name(1, 1)]);
      } else {
        return getVNode('im_chat_kick_user_short', type(1), [name(1, 1)]);
      }

    case 'chat_screenshot':
      return getVNode('im_chat_screenshot', type(0), [name(0)]);

    default:
      console.warn('[im] Неизвестное действие:', msg.action.type);
      return msg.action.type;
  }
}
</script>
