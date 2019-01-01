<template>
  <div class="auth_wrap" @keydown.enter="auth">
    <img src="images/logo.png" class="auth_logo">
    <div class="auth_name">VK Desktop</div>
    <input class="input" type="text" :placeholder="l('enter_login')" v-model="login">
    <input class="input" type="password" :placeholder="l('enter_password')" v-model="password">
    <div class="auth_error" v-if="error">{{ l('invalid_login_or_password') }}</div>
    <button class="button auth_button" @click="auth" :disabled="disableBtn">{{ l('login') }}</button>
  </div>
</template>

<script>
  const { getFirstToken } = require('./auth');

  module.exports = {
    data: () => ({
      login: '',
      password: '',
      error: false,
      inProgress: false
    }),
    computed: {
      disableBtn() {
        return this.inProgress || !(this.login.trim() && this.password.trim());
      }
    },
    methods: {
      async auth() {
        this.inProgress = true;
        let data = await getFirstToken(this.login, this.password);
        this.inProgress = false;

        if(data.type == 'invalid_client') {
          this.error = true;
        } else if(data.type == 'need_validation') {
          this.$emit('auth', {
            type: data.type,
            mask: data.phone_mask,
            login: this.login,
            password: this.password
          });
        }
      }
    }
  }
</script>
