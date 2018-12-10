<template>
  <div class="modal">
    <modal-header :closable="false">Введите капчу</modal-header>
    <div class="modal_content captcha">
      <div class="captcha_img">
        <img :src="data.src" @click="updateIMG">
      </div>
      <div class="captcha_key">
        <input class="input" placeholder="Введите код с картинки"
               v-model="text" @keydown.enter="sendCode">
      </div>
    </div>
    <div class="modal_bottom">
      <button class="button right" :disabled="disabled" @click="sendCode">Отправить</button>
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
        event.target.src += '1';
      },
      sendCode() {
        if(this.disabled) return;

        this.data.send(this.text);
        this.$modals.close();
      }
    }
  }
</script>
