<template>
  <div :class="['message_expire_time', { icon: expireIcon }]" @click="toggleIcon">
    <Icon v-if="expireIcon" name="bomb" width="15" height="15" />
    <template v-else>{{ expireTime }}</template>
  </div>
</template>

<script>
import { ref, onUnmounted } from 'vue';
import { format } from 'js/date/utils';
import getTranslate from 'js/getTranslate';

import Icon from '../../UI/Icon.vue';

export default {
  props: ['msg', 'expireIcon'],

  emits: ['update'],

  components: {
    Icon
  },

  setup(props, { emit }) {
    const expireTime = ref('');

    const expireDate = new Date();
    const getElapsedTime = () => Math.ceil(Date.now() / 1000 - props.msg.date) + 1;

    function updateDate() {
      const secs = props.msg.expireTtl - getElapsedTime();
      expireDate.setHours(0, 0, secs, 0);

      if (secs >= 0) {
        const hours = expireDate.getHours();

        emit('update', {
          key: 'expireHours',
          value: !!hours
        });

        expireTime.value = hours
          ? hours + getTranslate('date_symbols', 'hour')
          : format(expireDate, 'mm:ss');
      } else {
        clearIntervals();
      }
    }

    let timer;
    let closeTimeTimer;

    function clearIntervals() {
      clearInterval(timer);
      clearInterval(closeTimeTimer);
    }

    onUnmounted(clearIntervals);

    function toggleIcon() {
      emit('update', {
        key: 'expireIcon',
        value: !props.expireIcon
      });

      if (props.expireIcon) {
        updateDate();
        timer = setInterval(updateDate, 1000);
        closeTimeTimer = setInterval(toggleIcon, 5000);
      } else {
        clearIntervals();
      }
    }

    return {
      expireTime,
      toggleIcon
    };
  }
};
</script>

<style>
.message_expire_time {
  position: absolute;
  display: flex;
  align-items: center;
  z-index: 1;
  background: var(--background);
  border-radius: 9px;
  padding: 2px 5px;
  border: 1px solid var(--background-light-steel-gray);
  bottom: 1px;
  color: var(--text-dark-steel-gray);
  font-weight: 500;
  font-size: 11px;
  height: 19px;
  user-select: none;
  cursor: pointer;
}

.message_expire_time.icon {
  padding: 1px 5px;
}

.message.out .message_expire_time {
  right: calc(100% - 8px);
}

.message:not(.out) .message_expire_time {
  left: calc(100% - 8px);
}
</style>
