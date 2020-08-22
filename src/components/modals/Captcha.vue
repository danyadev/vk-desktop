<template>
  <div class="modal">
    <ModalHeader unclosable>{{ l('ml_captcha_header') }}</ModalHeader>
    <div class="modal_content">
      <div class="captcha_img">
        <img :src="src" @click="updateImg">
      </div>
      <div class="captcha_key">
        <input
          ref="input"
          v-model="code"
          class="input"
          :placeholder="l('ml_captcha_write')"
          @keydown.enter="sendCode"
        >
      </div>
    </div>
    <div class="modal_footer">
      <Button class="right" :disabled="disabled" @click="sendCode">{{ l('send') }}</Button>
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs, onMounted } from 'vue';
import { closeModal } from 'js/modals';

import ModalHeader from './ModalHeader.vue';
import Button from '../UI/Button.vue';

export default {
  props: ['src', 'send'],

  components: {
    ModalHeader,
    Button
  },

  setup(props) {
    const state = reactive({
      input: null,
      code: '',
      src: props.src,
      disabled: computed(() => !state.code.trim())
    });

    function updateImg() {
      state.src += (state.src.indexOf('&s=1') === -1) ? '&s=1' : '1';
    }

    function sendCode() {
      if (state.disabled) {
        return;
      }

      props.send(state.code.trim());
      closeModal('captcha');
    }

    onMounted(() => {
      requestIdleCallback(() => {
        state.input.focus();
      });
    });

    return {
      ...toRefs(state),

      updateImg,
      sendCode
    };
  }
};
</script>

<style>
.modal[data-name=captcha] .modal_content {
  width: 300px;
}

.captcha_img {
  display: flex;
  justify-content: center;
  padding-top: 15px;
}

.captcha_img img {
  border: 1px solid var(--separator);
  width: 132px;
  height: 52px;
}

.captcha_key {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
</style>
