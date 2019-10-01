<template>
  <div class="auth" @keydown.enter="auth">
    <div class="auth_code_header">{{ l('security_check') }}</div>
    <div class="auth_code_descr">{{ l('code_sent_to', isAppCode, [data.phone_mask]) }}</div>
    <input class="input" ref="input" :placeholder="l('enter_code')" v-model="code"/>
    <div class="auth_code_buttons">
      <Button light @click="cancel" :disabled="load">{{ l('cancel') }}</Button>
      <Button @click="auth" :disabled="load || !code.trim()">{{ l('login') }}</Button>
    </div>
    <div :class="['auth_error', { active: error }]">{{ l('wrong_code') }}</div>
  </div>
</template>

<script>
  import { getAndroidToken } from './auth';
  import Button from '../UI/Button.vue';

  export default {
    props: ['data'],
    components: {
      Button
    },
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

        if(data.error == 'invalid_request') {
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

<style>
  .auth_code_header {
    font-size: 24px;
    margin-bottom: 5px;
  }

  .auth_code_descr {
    font-size: 14px;
    margin-bottom: 20px;
    width: 310px;
  }

  .auth_code_buttons .button { width: 123px }
</style>
