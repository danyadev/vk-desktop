<template>
  <div class="auth_wrap auth_code_section" @keydown.enter="auth">
    <div class="auth_code_header">{{ l('auth_security_check') }}</div>
    <div class="auth_code_descr">{{ l('auth_code_sent', isAppCode, [data.phone_mask]) }}</div>
    <input class="input" type="text" ref="input" :placeholder="l('enter_code')" v-model="code"/>
    <div class="auth_error" v-if="error">{{ l('invalid_code') }}</div>
    <div class="auth_code_buttons">
      <button class="light_button" @click="cancel" :disabled="load">{{ l('cancel') }}</button>
      <button class="button" @click="auth" :disabled="load || !code.trim()">{{ l('login') }}</button>
    </div>
  </div>
</template>

<script>
  const { getAndroidToken } = require('./auth');

  module.exports = {
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
        } else this.$emit('auth', { android_token: data.token });
      }
    },
    mounted() {
      this.$refs.input.focus();
    }
  }
</script>
