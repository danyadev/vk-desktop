<template>
    <Scrolly :vclass="['keyboard', { inline: keyboard.inline }]">
      <div v-for="line of buttons" class="keyboard_line">
        <Ripple v-for="({ action, color }, i) of line" :key="i"
                :color="
                  ['default', 'secondary'].includes(color) && action.type != 'vkpay'
                    ? 'rgba(0, 0, 0, .08)'
                    : 'rgba(0, 0, 0, .15)'
                "
                :class="['keyboard_button', action.type == 'vkpay' ? 'primary' : color]"
                :style="{ width: `${100 / line.length}%` }"
                @click="click(action)"
        >
          <div v-if="action.type == 'text'" v-emoji.br="action.label"></div>
          <template v-else-if="action.type == 'open_app'">
            <img class="keyboard_services_icon" src="~assets/services.svg">
            <div class="keyboard_service_key" v-emoji.br="action.label"></div>
          </template>
          <template v-else-if="action.type == 'vkpay'">
            {{ l('im_keyboard_pay_with') }}
            <img src="~assets/vk_pay.svg">
          </template>
          <template v-else-if="action.type == 'open_link'">
            <div class="keyboard_service_key" v-emoji.br="action.label"></div>
            <img src="~assets/link.svg" class="keyboard_link_icon">
          </template>
          <div v-else>{{ l('not_supported') }}</div>
        </Ripple>
      </div>
    </Scrolly>
</template>

<script>
  import electron from 'electron';
  import sendMessage from 'js/sendMessage';

  import Scrolly from '../../UI/Scrolly.vue';
  import Ripple from '../../UI/Ripple.vue';

  const { shell } = electron.remote;

  export default {
    props: ['peer_id', 'keyboard'],

    components: {
      Scrolly,
      Ripple
    },

    computed: {
      buttons() {
        return this.keyboard.buttons || [];
      }
    },

    methods: {
      click(action) {
        const hash = action.hash ? `#${action.hash}` : '';

        switch(action.type) {
          case 'text':
            sendMessage({
              peer_id: this.peer_id,
              keyboard: {
                action,
                author_id: this.keyboard.author_id,
                one_time: this.keyboard.one_time
              }
            });
            break;

          case 'open_app':
            shell.openExternal(`https://vk.com/app${action.app_id}${hash}`);
            break;

          case 'vkpay':
            shell.openExternal(`https://vk.com/app6217559${hash}`);
            break;

          case 'open_link':
            shell.openExternal(action.link);
            break;
        }
      }
    }
  }
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
    border-radius: 6px;
    text-align: center;
    color: #fff;
    cursor: pointer;
  }

  .keyboard_button, .keyboard_button div {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
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

  .keyboard_button img:not(.emoji) {
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
