<template>
  <div
    :class="['message_loading', { error: msg.error }]"
    :style="{ '--offset': menuOffset + 'px' }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <Icon v-if="!msg.error" name="recent" color="var(--icon-blue)" />
    <Icon v-else name="recent_error" color="var(--icon-red-light)" />

    <div ref="menu" :class="['message_loading_menu', { active }]">
      <div class="act_menu_item" @click="click(true)">
        <Icon name="replay" color="var(--icon-blue)" class="act_menu_icon" />
        <div class="act_menu_data">{{ l('im_retry_send') }}</div>
      </div>
      <div class="act_menu_item" @click="click()">
        <Icon name="trash" color="var(--icon-red)" class="act_menu_icon" />
        <div class="act_menu_data">{{ l('im_delete_message') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs } from 'vue';
import { addSnackbar } from 'js/snackbars';
import vkapi from 'js/vkapi';
import store from 'js/store';

import Icon from '@/UI/Icon.vue';

export default {
  props: ['msg'],

  components: {
    Icon
  },

  setup(props) {
    const state = reactive({
      menu: null,
      menuOffset: 0,

      active: false,
      timeout: null
    });

    function closeMenu() {
      clearTimeout(state.timeout);
      state.timeout = null;
      state.active = false;

      function onTransitionEnd(event) {
        if (event.propertyName === 'background-color') return;
        if (!state.active) state.menuOffset = 0;

        state.menu.removeEventListener('transitionend', onTransitionEnd);
      }

      state.menu.addEventListener('transitionend', onTransitionEnd);
    }

    async function click(retry) {
      closeMenu();

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
          await vkapi('messages.send', props.msg.params, { android: true });
          // Так как эта ошибка возникает только когда пользователю нельзя писать
          // в лс, при успешной отправке нужно разрешить писать сообщения
          setCanWrite(true);
        } catch (err) {
          setLoadingError(true);

          // 900 = Нельзя отправить пользователю из черного списка
          // 902 = Нельзя отправить сообщение из-за настроек приватности собеседника
          if ([900, 902].includes(err.error_code)) {
            setCanWrite(false);
          }

          addSnackbar({
            text: `Error ${err.error_code}. ${err.error_msg}`,
            icon: 'error',
            color: 'var(--icon-red)'
          });
        }
      } else {
        store.commit('messages/removeLoadingMessage', msgParams);
      }
    }

    function onMouseEnter() {
      if (!props.msg.error) {
        return;
      }

      const { x } = state.menu.getBoundingClientRect();
      if (x < 0) state.menuOffset = -x + 20;

      state.active = true;

      if (state.timeout) {
        clearTimeout(state.timeout);
        state.timeout = null;
      }
    }

    function onMouseLeave() {
      state.timeout = setTimeout(closeMenu, 250);
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
  left: -22px;
  bottom: 5px;
  user-select: none;
}

.message_loading.error {
  left: -21px;
  bottom: 6px;
  cursor: pointer;
}

.message_loading_menu {
  position: absolute;
  bottom: calc(100% + 16px);
  right: calc(100% - 20px - var(--offset));
  width: 210px;
  opacity: 0;
  pointer-events: none;
  z-index: 2;
  padding: 5px 0;
  background: var(--background-accent);
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
