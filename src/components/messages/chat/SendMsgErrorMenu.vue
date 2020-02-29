<template>
  <div :class="['message_loading', { error: msg.error }]" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <div :class="['message_loading_menu', { active }]">
      <div class="message_loading_menu_item" @click="click(true)">{{ l('im_retry_send') }}</div>
      <div class="message_loading_menu_item" @click="click()">{{ l('im_delete_message') }}</div>
    </div>
  </div>
</template>

<script>
  import vkapi from 'js/vkapi';

  export default {
    props: ['msg'],

    data: () => ({
      active: false,
      timeout: null
    }),

    methods: {
      async click(retry) {
        clearTimeout(this.timeout);
        this.timeout = null;
        this.active = false;

        const msgParams = {
          peer_id: this.msg.params.peer_id,
          random_id: this.msg.random_id
        };

        const setLoadingError = (error) => {
          this.$store.commit('messages/editLoadingMessage', { ...msgParams, error });
        }

        const setCanWrite = (canWrite) => {
          this.$store.commit('messages/updateConversation', {
            peer: {
              id: msgParams.peer_id,
              canWrite
            }
          });
        }

        if(retry) {
          setLoadingError(false);

          try {
            await vkapi('messages.send', this.msg.params);
            // т.к. эта ошибка возникает только когда пользователю нельзя писать
            // в лс, при успешной отправке нужно разрешить писать сообщения
            setCanWrite(true);
          } catch(err) {
            setLoadingError(true);

            // 900 = Нельзя отправить пользователю из черного списка
            // 902 = Нельзя отправить сообщение из-за настроек приватности собеседника
            if([900, 902].includes(err.error_code)) setCanWrite(false);
          }
        } else {
          this.$store.commit('messages/removeLoadingMessage', msgParams);
        }
      },

      onMouseEnter() {
        if(!this.msg.error) return;
        this.active = true;

        if(this.timeout) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
      },

      onMouseLeave() {
        this.timeout = setTimeout(() => {
          this.active = false;
          this.timeout = null;
        }, 500);
      }
    }
  }
</script>

<style>
  .message_loading {
    position: absolute;
    background: url(~assets/recent.svg) center / contain;
    width: 18px;
    height: 18px;
    left: -20px;
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
    background: var(--actions-background);
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

  .message_loading_menu_item {
    color: var(--text-link);
    padding: 10px 12px;
    cursor: pointer;
    transition: background-color .3s;
  }

  .message_loading_menu_item:hover {
    background: var(--actions-background-hover);
  }
</style>
