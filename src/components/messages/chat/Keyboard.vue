<template>
    <Scrolly vclass="keyboard">
      <div v-for="line of buttons" class="keyboard_line">
        <Ripple v-for="({ action, color }, i) of line" :key="i"
                :text="action.type == 'text' ? emoji(action.label) : 'Не поддерживается'"
                :color="color == 'default' ? '#ced7e0' : 'rgba(0, 0, 0, .2)'"
                :class="['keyboard_button', color]"
                @click="click(action)"
        />
      </div>
    </Scrolly>
</template>

<script>
  import Scrolly from '../../UI/Scrolly.vue';
  import Ripple from '../../UI/Ripple.vue';
  import emoji from 'js/emoji';

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
      emoji: emoji,
      click(action) {
        switch(action.type) {
          case 'text':
            this.$emit('click', action, this.keyboard.author_id);
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
    flex: 1;
    margin: 0 4px;
    padding: 10px 8px;
    border-radius: 6px;
    text-align: center;
    color: #fff;
    cursor: pointer;
    user-select: none;

    overflow: hidden;
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
</style>
