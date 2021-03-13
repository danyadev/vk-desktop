<template>
  <Scrolly :vclass="['keyboard', { inline: keyboard.inline }]">
    <div v-for="(line, i) of buttons" :key="i" class="keyboard_line">
      <Ripple
        v-for="{ action, color } of line"
        :key="action"
        :color="
          // vkpay приходит с цветом default, однако в приложении имеет синий цвет
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

        <div v-else-if="action.type === 'open_link'" class="keyboard_service_key">
          <VKText>{{ action.label }}</VKText>
        </div>

        <template v-else-if="action.type === 'callback'">
          <Icon
            v-if="activeCallbackButtons.find((btn) => btn.action === action)"
            name="spinner"
            class="spinner"
          />
          <VKText v-else>{{ action.label }}</VKText>
        </template>

        <div v-else>{{ l('keyboard_button_not_supported') }}</div>
      </Ripple>
    </div>
  </Scrolly>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import electron from 'electron';
import { activeKeyboardCallbackButtons } from 'js/messages';
import { addSnackbar } from 'js/snackbars';
import vkapi from 'js/vkapi';
import sendMessage from 'js/sendMessage';

import Scrolly from '../../UI/Scrolly.vue';
import Ripple from '../../UI/Ripple.vue';
import VKText from '../../UI/VKText.vue';
import Icon from '../../UI/Icon.vue';

const { shell } = electron.remote;

export default {
  props: ['peer_id', 'keyboard', 'msg_id'],

  components: {
    Scrolly,
    Ripple,
    VKText,
    Icon
  },

  setup(props) {
    const state = reactive({
      buttons: computed(() => props.keyboard.buttons || []),
      activeCallbackButtons: []
    });

    function getAppLink(action) {
      const owner_id = action.owner_id ? `_${action.owner_id}` : '';
      const hash = action.hash ? `#${action.hash}` : '';
      return `https://vk.com/app${action.app_id}${owner_id}${hash}`;
    }

    function onKeyboardCallback(data) {
      const btn = state.activeCallbackButtons.find((btn) => btn.event_id === data.event_id);

      if (data.peer_id !== props.peer_id || !btn) {
        return;
      }

      clearTimeout(btn.timeout);
      stopCallbackBtn(btn);

      if (!data.action) {
        return;
      }

      switch (data.action.type) {
        case 'show_snackbar':
          addSnackbar({
            text: data.action.text,
            duration: 8000,
            closable: true
          });
          break;

        case 'open_link':
          shell.openExternal(data.action.link);
          break;

        case 'open_app':
          shell.openExternal(getAppLink(data.action));
          break;

        default:
          console.warn('[keyboard] Неизвестный тип callback-кнопки:', data.action);
          break;
      }
    }

    function stopCallbackBtn(btn) {
      const index = state.activeCallbackButtons.indexOf(btn);

      if (index > -1) {
        state.activeCallbackButtons.splice(index, 1);
      }

      delete activeKeyboardCallbackButtons[btn.event_id];
    }

    async function click(action) {
      const hash = action.hash ? `#${action.hash}` : '';

      switch (action.type) {
        case 'text':
          sendMessage({
            peer_id: props.peer_id,
            keyboardButton: {
              action,
              author_id: props.keyboard.author_id,
              one_time: props.keyboard.one_time
            }
          });
          break;

        case 'open_app':
          shell.openExternal(getAppLink(action));
          break;

        case 'vkpay':
          shell.openExternal(`https://vk.com/app6217559${hash}`);
          break;

        case 'open_link':
          shell.openExternal(action.link);
          break;

        case 'callback':
          // Игнорируем клик по кнопке, у которой еще не пришел ответ
          if (state.activeCallbackButtons.find((btn) => btn.action === action)) {
            return;
          }

          const length = state.activeCallbackButtons.push({ action });
          const btn = state.activeCallbackButtons[length - 1];

          const param = props.msg_id
            ? { message_id: props.msg_id }
            : { author_id: props.keyboard.author_id };

          const event_id = await vkapi('messages.sendMessageEvent', {
            peer_id: props.peer_id,
            payload: action.payload,
            ...param
          });

          btn.event_id = event_id;
          btn.timeout = setTimeout(() => stopCallbackBtn(btn), 30 * 1000);

          activeKeyboardCallbackButtons[event_id] = onKeyboardCallback;
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
  padding: 8px 12px 12px 12px;
  user-select: none;
}

.keyboard:not(.inline) {
  max-height: 40vh;
}

/* Отображается в карусели */
.keyboard.inline {
  padding: 0;
}

.message_bubble .keyboard.inline {
  padding: 8px 0 0 0;
  /* Нужно для того, чтобы время у сообщения (если оно не вмещается после текста) не отнимало */
  /* место у клавиатуры */
  width: calc(100% + 3px * 2);
  margin-left: -3px;
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
  border-radius: 10px;
}

.keyboard.inline .keyboard_button:not(:last-child) {
  margin-right: 6px;
}

.keyboard_button.default,
.keyboard_button.secondary {
  background: #004a961f;
  color: var(--button-light-color);
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

.keyboard_button > img:not(.emoji) {
  height: 24px;
}

.keyboard_service_key {
  color: var(--text-light-blue);
}

.keyboard_services_icon {
  margin-right: 5px;
}

.spinner {
  animation: spinner .7s infinite linear;
}
</style>
