<template>
  <div class="auth_wrap" @keydown.enter="auth">
    <img src="~assets/logo.png" class="auth_logo">
    <div class="auth_name">VK Desktop</div>
    <input class="input" type="text" :placeholder="l('enter_login')" v-model="login">
    <div class="auth_password_wrap">
      <input class="input" :type="inputType" :placeholder="l('enter_password')" v-model="password">
      <div :class="['auth_password_switch', { hidden: hidePassword }]"
           @click="hidePassword = !hidePassword"
      ></div>
    </div>
    <button class="button auth_button" :disabled="disableBtn" @click="auth">{{ l('login') }}</button>
    <div :class="['auth_error', { active: error }]">{{ l('wrong_login_or_password') }}</div>
  </div>
</template>

<script>
  import { getAndroidToken } from './auth';

  export default {
    data: () => ({
      login: '',
      password: '',
      error: false,
      progress: false,
      hidePassword: true
    }),
    computed: {
      disableBtn() {
        return this.progress || !(this.login.trim() && this.password.trim());
      },
      inputType() {
        return this.hidePassword ? 'password' : 'text';
      }
    },
    methods: {
      async auth() {
        this.progress = true;
        this.error = false;

        const data = await getAndroidToken(this.login, this.password);

        if(data.error == 'invalid_client') {
          this.error = true;
          this.progress = false;
        } else if(data.error == 'need_validation') {
          this.$emit('auth', {
            login: this.login,
            password: this.password,
            ...data
          });
        } else this.$emit('auth', data);
      }
    }
  }
</script>

<style scoped>
  .auth_wrap { text-align: center }
  .auth_wrap input { margin-bottom: 6px }
  .auth_password_wrap { position: relative }

  .auth_password_switch {
    position: absolute;
    top: 0;
    right: 0;
    opacity: .8;
    width: 34px;
    height: 34px;
    background: url('~assets/show.svg') 50% no-repeat;
    transition: opacity .3s;
  }

  .auth_password_switch:hover { opacity: 1 }
  .auth_password_switch.hidden {
    background-image: url('~assets/hide.svg');
  }

  .auth_logo {
    width: 125px;
    height: 125px;
  }

  .auth_name {
    font-size: 20px;
    margin: 15px 0 30px 0;
  }

  .auth_error {
    padding: 7px 0;
    margin-top: 6px;
    color: #de3f3f;
    border: 1px solid #de3f3f;
    border-radius: 5px;
    opacity: 0;
    transition: opacity .3s;
  }

  .auth_error.active { opacity: 1 }
  .auth_button { width: 250px }
</style>
