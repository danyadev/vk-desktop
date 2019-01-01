<template>
  <div class="auth">
    <auth-form v-if="!needValidation" @auth="onAuth"></auth-form>
    <auth-code v-else :data="needValidation" @auth="onAuth"></auth-code>
  </div>
</template>

<script>
  const { getLastToken } = require('./auth');

  module.exports = {
    data: () => ({
      needValidation: null
    }),
    methods: {
      async onAuth(data) {
        if(data.type == 'need_validation') {
          this.needValidation = data;
        } else if(data.type == 'cancel_enter_code') {
          this.needValidation = null;
        } else if(data.type = 'auth_completed') {
          let lastToken = await getLastToken(data.other_token),
              [ user ] = await vkapi('users.get', { access_token: lastToken });

          this.$store.commit('updateUser', Object.assign(user, {
            access_token: lastToken,
            other_token: data.other_token
          }));

          this.$store.commit('setActiveUser', user.id);
        }
      }
    }
  }
</script>
