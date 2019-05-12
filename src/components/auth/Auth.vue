<template>
  <AuthForm v-if="!error" :isModal="isModal" @auth="auth"/>
  <AuthCode v-else :data="error" @auth="auth"/>
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

          if(this.isModal) this.$modals.close(this.$parent.$attrs.name);
          else this.$store.commit('users/setActiveUser', user.id);
        }
      }
    }
  }
</script>

<style>
  .auth {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: center;
  }

  .auth input { margin-bottom: 6px }

  .auth_error {
    font-family: BlinkMacSystemFont, Roboto;
    padding: 8px 0;
    margin: 6px 0;
    width: 250px;
    color: #de3f3f;
    border: 1px solid #de3f3f;
    border-radius: 5px;
    opacity: 0;
    transition: opacity .3s;
  }

  .auth_error.active { opacity: 1 }
</style>
