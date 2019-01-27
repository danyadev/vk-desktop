<template>
  <div class="modal">
    <modal-header :closable="false">{{ l('captcha_header') }}</modal-header>
    <div class="modal_content captcha">
      <div class="captcha_img">
        <img :src="data.src" @click="updateIMG">
      </div>
      <div class="captcha_key">
        <input class="input" :placeholder="l('write_code_from_img')"
               v-model="text" @keydown.enter="sendCode">
      </div>
    </div>
    <div class="modal_bottom">
      <button class="button right" :disabled="disabled" @click="sendCode">{{ l('send') }}</button>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['data'],
    data: () => ({
      text: ''
    }),
    computed: {
      disabled() {
        return !this.text.trim();
      }
    },
    methods: {
      updateIMG(event) {
        event.target.src += this.data.src.indexOf('&s=1') != -1 ? '1' : '&s=1';
      },
      sendCode() {
        if(this.disabled) return;

        this.data.send(this.text.trim());
        this.$modals.close(this.$attrs['data-key']);
      }
    }
  }
</script>
