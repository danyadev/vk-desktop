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
import store from 'js/store';
import getTranslate from 'js/getTranslate';

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

    function getText(type, ids) {
      if (ids.length === 1) {
        return getTranslate(`im_typing_${type}`, 0, [name(ids[0])]);
      } else if (ids.length === 2) {
        return getTranslate(`im_typing_${type}`, 1, [name(ids[0]), name(ids[1])]);
      }

      return getTranslate(`im_typing_${type}`, 2, [name(ids[0]), ids.length - 1]);
    }

    const typing = computed(() => store.state.messages.typing[props.peer_id]);

    const text = computed(() => {
      const typingIds = {};
      let msg = '';

      for (const id in typing.value) {
        const { type } = typing.value[id];

        (typingIds[type] || (typingIds[type] = [])).push(id);
      }

      for (const [type, ids] of Object.entries(typingIds)) {
        msg += getText(type, ids);
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
  font-size: 14px;
  margin-top: 1px;
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
  background: var(--background-blue);
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
  margin-bottom: 1px;
}

.typing_item:nth-child(2) {
  animation-delay: .37s;
}

.typing_item:nth-child(3) {
  animation-delay: .74s;
}
</style>
