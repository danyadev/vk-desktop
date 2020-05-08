<template>
  <Scrolly :vclass="['keyboard', { inline: keyboard.inline }]">
    <div v-for="(line, i) of buttons" :key="i" class="keyboard_line">
      <Ripple
        v-for="{ action, color } of line"
        :key="action"
        :color="
          ['default', 'secondary'].includes(color) && action.type !== 'vkpay'
            ? 'rgba(0, 0, 0, .08)'
            : 'rgba(0, 0, 0, .15)'
        "
        :class="['keyboard_button', action.type === 'vkpay' ? 'primary' : color]"
        :style="{ width: `${100 / line.length}%` }"
        @click="click(action)"
      >
        <div v-if="action.type === 'text'">
          <VKText>{{ action.label }}</VKText>
        </div>

        <template v-else-if="action.type === 'open_app'">
          <img class="keyboard_services_icon" src="~assets/services.svg">
          <div class="keyboard_service_key"><VKText>{{ action.label }}</VKText></div>
        </template>

        <template v-else-if="action.type === 'vkpay'">
          <div>{{ l('im_keyboard_pay_with') }}</div>
          <img src="~assets/vk_pay.svg">
        </template>

        <template v-else-if="action.type === 'open_link'">
          <div class="keyboard_service_key"><VKText>{{ action.label }}</VKText></div>
          <img src="~assets/link.svg" class="keyboard_link_icon">
        </template>

        <div v-else>{{ l('keyboard_button_not_supported') }}</div>
      </Ripple>
    </div>
  </Scrolly>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import electron from 'electron';
import sendMessage from 'js/sendMessage';

import Scrolly from '../../UI/Scrolly.vue';
import Ripple from '../../UI/Ripple.vue';
import VKText from '../../UI/VKText.vue';

const { shell } = electron.remote;

export default {
  props: ['peer_id', 'keyboard'],

  components: {
    Scrolly,
    Ripple,
    VKText
  },

  setup(props) {
    const state = reactive({
      buttons: computed(() => props.keyboard.buttons || [])
    });

    function click(action) {
      const hash = action.hash ? `#${action.hash}` : '';

      switch (action.type) {
        case 'text':
          sendMessage({
            peer_id: props.peer_id,
            keyboard: {
              action,
              author_id: props.keyboard.author_id,
              one_time: props.keyboard.one_time
            }
          });
          break;

        case 'open_app':
          shell.openItem(`https://vk.com/app${action.app_id}${hash}`);
          break;

        case 'vkpay':
          shell.openItem(`https://vk.com/app6217559${hash}`);
          break;

        case 'open_link':
          shell.openItem(action.link);
          break;
      }
    }

    return {
      ...toRefs(state),
      click
    };
  }
};
</script>

<style>
.keyboard {
  max-height: 40vh;
  padding: 8px 12px 12px 12px;
  user-select: none;
}

.keyboard.inline {
  padding: 6px 0 0 0;
}

.keyboard_line {
  display: flex;
}

.keyboard_line:not(:last-child) {
  padding-bottom: 8px;
}

.keyboard.inline .keyboard_line:not(:last-child) {
  padding-bottom: 6px;
}

.keyboard_button {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 4px;
  padding: 0 8px;
  height: 38px;
  line-height: 18px;
  border-radius: 6px;
  text-align: center;
  color: #fff;
  cursor: pointer;
}

.keyboard.inline .keyboard_button {
  margin: 0;
}

.keyboard.inline .keyboard_button:not(:last-child) {
  margin-right: 6px;
}

.keyboard_button.default,
.keyboard_button.secondary {
  background: #0039731a;
  color: #45586f;
}

.keyboard_button.primary {
  background: #5181b8;
}

.keyboard_button.positive {
  background: #4bb34b;
}

.keyboard_button.negative {
  background: #e64646;
}

.keyboard_button > img {
  height: 24px;
}

.keyboard_service_key {
  color: #0f5cb3;
}

.keyboard_services_icon {
  margin-right: 5px;
}

.keyboard_link_icon {
  margin-left: 1px;
  width: 20px;
}
</style>
