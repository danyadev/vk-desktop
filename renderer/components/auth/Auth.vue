<template>
  <div class="auth">
    <auth-form v-if="!needValidation" @auth="onAuth"></auth-form>
    <auth-code v-else :data="needValidation" @auth="onAuth"></auth-code>
  </div>
</template>

<script>
  const { getDesktopToken } = require('./auth');

  module.exports = {
    props: ['isModal'],
    data: () => ({
      needValidation: null
    }),
    methods: {
      async onAuth(data) {
        if(data.type == 'need_validation') this.needValidation = data;
        else if(data.type == 'cancel_enter_code') this.needValidation = null;
        else if(data.type == 'auth_completed') {
          let lastToken = await getDesktopToken(data.other_token);
          let [ user ] = await vkapi('users.get', {
            access_token: lastToken,
            fields: utils.fields
          });

          this.$store.commit('settings/updateUser', Object.assign(user, {
            access_token: lastToken,
            other_token: data.other_token
          }));

          if(this.isModal) this.$modals.close(this.$parent.$attrs['data-key']);
          else this.$store.commit('settings/setActiveUser', user.id);
        }
      }
    },
    mounted() {
      const { users, activeUser } = this.$store.state.settings;

      // Если человек находится на авторизации и у него есть другие
      // аккаунты в мультиакке, то отокроется модалка с этими акками
      if(Object.keys(users).length && !activeUser) {
        setTimeout(() => this.$modals.open('multiaccount'), 1000);
      }
    }
  }
</script>
