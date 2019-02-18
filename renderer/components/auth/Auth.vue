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
        if(data.error == 'need_validation') this.needValidation = data;
        else if(data.error == 'cancel_enter_code') this.needValidation = null;
        else {
          const token = await getDesktopToken(data.android_token);
          const [ user ] = await vkapi('users.get', {
            access_token: token,
            fields: utils.fields
          });

          this.$store.commit('settings/updateUser', {
            ...user,
            access_token: token,
            android_token: data.android_token
          });

          if(this.isModal) this.$modals.close(this.$parent.$attrs['data-key']);
          else this.$store.commit('settings/setActiveUser', user.id);
        }
      }
    },
    mounted() {
      const { users, activeUser } = this.$store.state.settings;

      // В случае, когда юзер вышел в авторизацию и в приложении
      // сохранены другие аккаунты, показывается список этих аккаунтов
      if(Object.keys(users).length && !activeUser) {
        setTimeout(() => this.$modals.open('multiaccount'), 1000);
      }
    }
  }
</script>
