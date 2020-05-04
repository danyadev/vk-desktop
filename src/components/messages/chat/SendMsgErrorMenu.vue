<template>
  <div
    :class="['message_loading', { error: msg.error }]"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div :class="['message_loading_menu', { active }]">
      <div class="act_menu_item" @click="click(true)">
        <Icon name="replay" color="var(--icon-dark-gray)" class="act_menu_icon" />
        <div class="act_menu_data">{{ l('im_retry_send') }}</div>
      </div>
      <div class="act_menu_item" @click="click()">
        <Icon name="trash" color="var(--icon-dark-gray)" class="act_menu_icon" />
        <div class="act_menu_data">{{ l('im_delete_message') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs } from 'vue';
import store from 'js/store';
import vkapi from 'js/vkapi';

import Icon from '../../UI/Icon.vue';

export default {
  props: ['msg'],

  components: {
    Icon
  },

  setup(props) {
    const state = reactive({
      active: false,
      timeout: null
    });

    async function click(retry) {
      clearTimeout(state.timeout);
      state.timeout = null;
      state.active = false;

      const msgParams = {
        peer_id: props.msg.params.peer_id,
        random_id: props.msg.random_id
      };

      function setLoadingError(error) {
        store.commit('messages/editLoadingMessage', { ...msgParams, error });
      }

      function setCanWrite(isWriteAllowed) {
        store.commit('messages/updateConversation', {
          peer: {
            id: msgParams.peer_id,
            isWriteAllowed
          }
        });
      }

      if (retry) {
        setLoadingError(false);

        try {
          await vkapi('messages.send', props.msg.params, {
            android: true
          });
          // т.к. эта ошибка возникает только когда пользователю нельзя писать
          // в лс, при успешной отправке нужно разрешить писать сообщения
          setCanWrite(true);
        } catch (err) {
          setLoadingError(true);

          // 900 = Нельзя отправить пользователю из черного списка
          // 902 = Нельзя отправить сообщение из-за настроек приватности собеседника
          if ([900, 902].includes(err.error_code)) {
            setCanWrite(false);
          }
        }
      } else {
        store.commit('messages/removeLoadingMessage', msgParams);
      }
    }

    function onMouseEnter() {
      if (!props.msg.error) {
        return;
      }

      state.active = true;

      if (state.timeout) {
        clearTimeout(state.timeout);
        state.timeout = null;
      }
    }

    function onMouseLeave() {
      state.timeout = setTimeout(() => {
        state.active = false;
        state.timeout = null;
      }, 500);
    }

    return {
      ...toRefs(state),

      click,
      onMouseEnter,
      onMouseLeave
    };
  }
};
</script>

<style>
.message_loading {
  position: absolute;
  background: url(~assets/recent.svg) center / contain;
  width: 18px;
  height: 18px;
  left: -21px;
  bottom: 7px;
  user-select: none;
}

.message_loading.error {
  background: url(~assets/recent_error.svg);
  width: 16px;
  height: 16px;
  bottom: 8px;
  cursor: pointer;
}

.message_loading_menu {
  position: absolute;
  bottom: calc(100% + 16px);
  right: calc(100% - 20px);
  width: max-content;
  opacity: 0;
  pointer-events: none;
  padding: 6px 0;
  background: var(--background);
  border-radius: 6px;
  box-shadow: 0 0 4px rgba(0, 0, 0, .2),
              0 4px 36px -6px rgba(0, 0, 0, .4);
  transition: opacity .3s, bottom .3s;
}

.message_loading_menu.active {
  bottom: calc(100% + 10px);
  opacity: 1;
  pointer-events: all;
}
</style>
