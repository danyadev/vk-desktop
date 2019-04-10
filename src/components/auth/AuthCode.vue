<template>
  <div class="auth_wrap" @keydown.enter="auth">
    <div class="auth_code_header">{{ l('security_check') }}</div>
    <div class="auth_code_descr">{{ l('code_sent_to', isAppCode, [data.phone_mask]) }}</div>
    <input class="input" ref="input" :placeholder="l('enter_code')" v-model="code"/>
    <div class="auth_error" v-if="error">{{ l('wrong_code') }}</div>
    <div class="auth_code_buttons">
      <button class="light_button" @click="cancel" :disabled="load">{{ l('cancel') }}</button>
      <button class="button" @click="auth" :disabled="load || !code.trim()">{{ l('login') }}</button>
    </div>
  </div>
</template>

<script>
  import { getAndroidToken } from './auth';
  
  export default {
    props: ['data'],
    data: () => ({
      code: '',
      load: false,
      error: false
    }),
    computed: {
      isAppCode() {
        return this.data.validation_type == '2fa_app';
      }
    },
    methods: {
      cancel() {
        this.$emit('auth', { error: 'cancel_enter_code' });
      },
      async auth() {
        this.load = true;
        this.error = false;

        const data = await getAndroidToken(this.data.login, this.data.password, { code: this.code });

        if(data.error == 'invalid_code') {
          this.load = false;
          this.error = true;
        } else this.$emit('auth', data);
      }
    },
    mounted() {
      this.$refs.input.focus();
    }
  }
</script>

<style scoped>
  .auth_wrap { text-align: center }
  .auth_wrap input { margin-bottom: 6px }

  .auth_error {
    padding: 7px 0;
    margin-bottom: 6px;
    color: #de3f3f;
    border: 1px solid #de3f3f;
    border-radius: 5px;
  }

  .auth_code_header {
    font-size: 24px;
    margin-bottom: 5px;
  }

  .auth_code_descr {
    font-size: 14px;
    margin-bottom: 20px;
    width: 300px;
  }

  .auth_code_buttons button { width: 123px }
</style>
