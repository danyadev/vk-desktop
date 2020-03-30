<template>
  <div :class="['typing_wrap', { isChat }]">
    <div class="typing_text text-overflow">{{ text }}</div>
    <div class="typing">
      <div class="typing_item"></div>
      <div class="typing_item"></div>
      <div class="typing_item"></div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { loadProfile } from 'js/utils';
import getTranslate from 'js/getTranslate';
import store from 'js/store';

export default {
  props: ['peer_id', 'isChat'],

  setup(props) {
    function name(id) {
      const user = store.state.profiles[id];

      if (props.peer_id < 2e9) {
        return '';
      }

      if (!user) {
        loadProfile(id);
        return '...';
      }

      return user.name || `${user.first_name} ${user.last_name[0] + '.'}`;
    }

    function getText(type, users) {
      if (users.length === 1) {
        return getTranslate(`im_typing_${type}`, 0, [name(users[0])]);
      } else if (users.length === 2) {
        return getTranslate(`im_typing_${type}`, 1, [name(users[0]), name(users[1])]);
      }

      return getTranslate(`im_typing_${type}`, 2, [name(users[0]), users.length - 1]);
    }

    const typing = computed(() => store.state.messages.typing[props.peer_id]);

    const text = computed(() => {
      const typingText = [];
      const typingAudio = [];
      let msg = '';

      for (const id in typing.value) {
        if (typing.value[id].type === 'text') {
          typingText.push(id);
        } else {
          typingAudio.push(id);
        }
      }

      if (typingText.length) {
        msg += getText('text', typingText);
      }

      if (typingText.length && typingAudio.length) {
        msg += ` ${getTranslate('and')} `;
      }

      if (typingAudio.length) {
        msg += getText('audio', typingAudio);
      }

      return msg;
    });

    return {
      text
    };
  }
};
</script>

<style>
.typing_wrap {
  display: flex;
  color: var(--text-blue);
}

.typing_wrap.isChat {
  color: var(--blue-background-text-alpha);
  font-size: 13px;
  margin-top: 2px;
  justify-content: center;
}

.typing {
  margin: 0 6px;
  flex: none;
}

@keyframes typing {
  0% { opacity: 1 }
  30% { opacity: .5 }
  100% { opacity: 1 }
}

.typing_item {
  display: inline-block;
  background: var(--blue-background);
  margin-bottom: 2px;
  animation: 1.1s linear 0s infinite typing;
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.typing_item:not(:last-child) {
  margin-right: 3px;
}

.typing_wrap.isChat .typing_item {
  background: var(--blue-background-text-alpha);
  margin-bottom: 1px;
}

.typing_item:nth-child(2) {
  animation-delay: .37s;
}

.typing_item:nth-child(3) {
  animation-delay: .74s;
}
</style>
