<template>
    <Scrolly vclass="keyboard">
      <div v-for="line of buttons" class="keyboard_line">
        <Ripple v-for="({ action, color }, i) of line" :key="i"
                :color="color == 'default' && action.type != 'vkpay' ? '#ced7e0' : 'rgba(0, 0, 0, .2)'"
                :class="['keyboard_button', action.type == 'vkpay' ? 'primary' : color]"
                @click="click(action)"
        >
          <div v-if="action.type == 'text'" v-emoji.br="action.label"></div>
          <template v-else-if="action.type == 'open_app'">
            <img src="~assets/services.svg">
            {{ action.label }}
          </template>
          <template v-else-if="action.type == 'vkpay'">
            {{ l('im_keyboard_pay_with') }}
            <img src="~assets/vk_pay.svg">
          </template>
          <div v-else>{{ l('not_supported') }}</div>
        </Ripple>
      </div>
    </Scrolly>
</template>

<script>
  import Scrolly from '../../UI/Scrolly.vue';
  import Ripple from '../../UI/Ripple.vue';
  import emoji from 'js/emoji';
  import electron from 'electron';

  const { shell } = electron.remote;

  export default {
    props: ['keyboard'],
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
      emoji,
      click(action) {
        switch(action.type) {
          case 'text':
            this.$emit('click', action, this.keyboard.author_id);
            break;

          case 'open_app':
            const hash = action.hash ? `#${action.hash}` : '';
            shell.openExternal(`https://vk.com/app${action.app_id}${hash}`);
            break;

          case 'vkpay':
            shell.openExternal(`https://vk.com/app6217559#${action.hash}`);
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
  }

  .keyboard_line {
    display: flex;
  }

  .keyboard_line:not(:last-child) {
    padding-bottom: 8px;
  }

  .keyboard_button {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
    margin: 0 4px;
    padding: 0 8px;
    height: 38px;
    border-radius: 6px;
    text-align: center;
    color: #fff;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .keyboard_button.default {
    background: #e5ebf1;
    color: #55677d;
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

  .keyboard_button img {
    height: 24px;
  }
</style>
