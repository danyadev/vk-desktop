<template>
  <div class="auth auth_code" @keydown.enter="auth()">
    <div class="auth_code_header">{{ l('security_check') }}</div>
    <div class="auth_code_descr">{{ l('code_sent_to', isAppCode, [data.phone_mask]) }}</div>
    <input class="input" ref="input" :placeholder="l('enter_code')" v-model="code">
    <div class="auth_code_buttons">
      <Button light @click="cancel" :disabled="load">{{ l('cancel') }}</Button>
      <Button @click="auth()" :disabled="load || !code.trim()">{{ l('login') }}</Button>
    </div>
    <div :class="['auth_error', { active: error }]">{{ l('wrong_code') }}</div>
    <a :class="['auth_use_sms', { hidden: forcedSms }]" @click="auth(true)">{{ l('use_force_sms') }}</a>
  </div>
</template>

<script>
  import { getAndroidToken } from './auth';
  import vkapi from 'js/vkapi';
  import Button from '../UI/Button.vue';

  export default {
    props: ['data'],

    components: {
      Button
    },

    data: () => ({
      code: '',
      load: false,
      error: false,
      forcedSms: false
    }),

    computed: {
      isAppCode() {
        return this.data.validation_type == '2fa_app';
      }
    },

    methods: {
      async auth(force_sms) {
        if(!force_sms && !this.code.trim() || this.load) return;

        this.load = true;
        this.error = false;

        if(force_sms) {
          this.forcedSms = true;

          try {
            await vkapi('auth.validatePhone', {
            	client_secret: 'hHbZxrka2uZ6jB1inYsH',
            	client_id: 2274003,
            	api_id: 2274003,
            	sid: this.data.validation_sid
            });

            this.data.validation_type = 'sms';
          } catch(e) {
            this.forcedSms = false;
          }

          this.load = false;
          return;
        }

        const data = await getAndroidToken(this.data.login, this.data.password, { code: this.code });

        if(data.error == 'invalid_request') {
          this.load = false;
          this.error = true;
        } else {
          this.$emit('auth', data);
        }
      },

      cancel() {
        this.$emit('auth', { error: 'cancel_enter_code' });

        this.code = '';
        this.error = false;
        this.forcedSms = false;
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
    margin-bottom: 10px;
  }

  .auth_code_descr {
    font-size: 14px;
    margin-bottom: 20px;
    width: 310px;
  }

  .auth_code_buttons .button {
    width: 123px;
  }

  .auth_code .auth_error {
    margin: 2px;
  }

  .auth_use_sms {
    position: absolute;
    bottom: 10px;
    transition: opacity .3s;
  }

  .auth_use_sms.hidden {
    opacity: 0;
  }
</style>
