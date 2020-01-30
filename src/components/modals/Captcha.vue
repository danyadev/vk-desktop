<template>
  <div class="modal">
    <ModalHeader :closable="false">{{ l('ml_captcha_header') }}</ModalHeader>
    <div class="modal_content">
      <div class="captcha_img">
        <img :src="imgSrc" @click="updatePic">
      </div>
      <div class="captcha_key">
        <input class="input"
               :placeholder="l('ml_captcha_write')"
               v-model="code"
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
  import ModalHeader from './ModalHeader.vue';
  import Button from '../UI/Button.vue';

  export default {
    props: ['src', 'send'],

    components: {
      ModalHeader,
      Button
    },

    data: () => ({
      imgSrc: '',
      code: ''
    }),

    computed: {
      disabled() {
        return !this.code.trim();
      }
    },

    methods: {
      updatePic() {
        this.imgSrc += ~this.imgSrc.indexOf('&s=1') ? '1' : '&s=1';
      },
      sendCode() {
        if(this.disabled) return;

        this.send(this.code.trim());
        this.$modals.close(this.$attrs.name);
      }
    },

    mounted() {
      this.imgSrc = this.src;
    }
  }
</script>

<style scoped>
  .modal_content {
    width: 300px;
    background: #fcfcfc;
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
