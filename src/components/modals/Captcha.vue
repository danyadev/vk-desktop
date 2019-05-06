<template>
  <div class="modal">
    <ModalHeader :closable="false">{{ l('modal_captcha_header') }}</ModalHeader>
    <div class="modal_content">
      <div class="captcha_img">
        <img :src="data.src" @click="updateIMG">
      </div>
      <div class="captcha_key">
        <input class="input"
               :placeholder="l('modal_captcha_write')"
               v-model="text"
               @keydown.enter="sendCode"
        >
      </div>
    </div>
    <div class="modal_footer">
      <button class="button right" :disabled="disabled" @click="sendCode">{{ l('send') }}</button>
    </div>
  </div>
</template>

<script>
  import ModalHeader from './ModalHeader.vue';

  export default {
    props: ['data'],
    components: { ModalHeader },
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
        this.data.src += this.data.src.indexOf('&s=1') != -1 ? '1' : '&s=1';
      },
      sendCode() {
        if(this.disabled) return;

        this.data.send(this.text.trim());
        this.$modals.close(this.$attrs.name);
      }
    }
  }
</script>

<style scoped>
  .modal_content {
    width: 300px;
    background-color: #fcfcfc;
  }

  .captcha_img {
    display: flex;
    justify-content: center;
    padding-top: 15px;
  }

  .captcha_img img {
    border: 1px solid #dadada;
    width: 132px;
    height: 52px;
  }

  .captcha_key {
    display: flex;
    justify-content: center;
    padding: 20px 0;
  }
</style>
