<template>
  <div class="auth">
    <AuthCode v-if="error" :data="error" @auth="auth"/>
    <AuthForm v-else @auth="auth"/>
  </div>
</template>

<script>
  import { getDesktopToken } from './auth';
  import { fields } from 'js/utils';
  import vkapi from 'js/vkapi';

  import AuthCode from './AuthCode.vue';
  import AuthForm from './AuthForm.vue';

  export default {
    components: { AuthCode, AuthForm },
    props: ['isModal'],
    data: () => ({
      error: null
    }),
    methods: {
      async auth(data) {
        if(data.error == 'need_validation') this.error = data;
        else if(data.error == 'cancel_enter_code') this.error = null;
        else {
          const access_token = await getDesktopToken(data.access_token);
          const [ user ] = await vkapi('users.get', { access_token, fields });

          this.$store.commit('users/updateUser', {
            ...user,
            access_token,
            android_token: data.access_token
          });

          this.$store.commit('users/setActiveUser', user.id);
        }
      }
    }
  }
</script>

<style scoped>
  .auth {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
</style>
