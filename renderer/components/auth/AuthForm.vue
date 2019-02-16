<template>
  <div class="auth_wrap" @keydown.enter="auth">
    <img src="images/logo.png" class="auth_logo"/>
    <div class="auth_name">VK Desktop</div>
    <input class="input" type="text" :placeholder="l('enter_login')" v-model="login"/>
    <span class="auth_password_wrap">
      <input class="input" :type="inputType" :placeholder="l('enter_password')" v-model="password"/>
      <div class="auth_password_switch"
           :class="{ hidden: hidePassword }"
           @click="hidePassword = !hidePassword"
      ></div>
    </span>
    <div class="auth_error" v-if="error">{{ l('invalid_login_or_password') }}</div>
    <button class="button auth_button" @click="auth" :disabled="disableBtn">{{ l('login') }}</button>
  </div>
</template>

<script>
  const { getAndroidToken } = require('./auth');

  module.exports = {
    data: () => ({
      login: '',
      password: '',
      error: false,
      inProgress: false,
      hidePassword: true
    }),
    computed: {
      disableBtn() {
        return this.inProgress || !(this.login.trim() && this.password.trim());
      },
      inputType() {
        return this.hidePassword ? 'password' : 'text';
      }
    },
    methods: {
      async auth() {
        this.inProgress = true;
        let data = await getAndroidToken(this.login, this.password);

        if(data.type == 'invalid_client') {
          this.error = true;
          this.inProgress = false;
        } else if(data.type == 'need_validation') {
          this.$emit('auth', {
            login: this.login,
            password: this.password,
            ...data
          });
        } else {
          this.$emit('auth', {
            type: 'auth_completed',
            other_token: data.token
          });
        }
      }
    }
  }
</script>
