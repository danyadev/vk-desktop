<template>
  <div class="auth" @keydown.enter="auth">
    <img src="~assets/logo.webp" class="auth_logo">
    <div class="auth_name">{{ l('vk_desktop') }}</div>
    <input
      ref="input"
      v-model="login"
      class="input"
      type="text"
      :placeholder="l('enter_login')"
      spellcheck="false"
    >
    <div class="auth_password_wrap">
      <input
        v-model="password"
        class="input"
        :type="hidePassword ? 'password' : 'text'"
        :placeholder="l('enter_password')"
        spellcheck="false"
      >
      <div
        :class="['auth_password_switch', { hidden: hidePassword }]"
        @click="hidePassword = !hidePassword"
      />
    </div>
    <Button class="auth_button" :disabled="!canAuth" @click="auth">{{ l('login') }}</Button>

    <div v-if="!onlyAddUser" class="auth_users">
      <div
        v-for="user of $store.state.users.users"
        :key="user.id"
        class="auth_user"
        @click="setAccount(user.id)"
      >
        <img
          :src="getPhoto(user)"
          data-context-menu="account"
          :data-id="user.id"
        >
        {{ user.first_name }}
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs, onMounted } from 'vue';
import { getPhoto } from 'js/utils';
import { openModal } from 'js/modals';
import { addSnackbar } from 'js/snackbars';
import store from 'js/store';
import getTranslate from 'js/getTranslate';
import { getAndroidToken } from '.';

import Button from '../UI/Button.vue';

export default {
  props: ['onlyAddUser'],
  emits: ['confirm', 'auth'],

  components: {
    Button
  },

  setup(props, { emit }) {
    const state = reactive({
      input: null,

      login: '',
      password: '',

      loading: false,
      hidePassword: true,

      canAuth: computed(() => !state.loading && state.login && state.password)
    });

    onMounted(() => {
      state.input.focus();
    });

    async function auth() {
      if (!state.canAuth) {
        return;
      }

      state.loading = true;

      const data = await getAndroidToken(state.login, state.password);

      switch (data.error) {
        case 'invalid_client':
          state.loading = false;
          addSnackbar({
            text: getTranslate('invalid_login_or_password')
          });
          break;

        case 'account_banned':
          state.loading = false;
          openModal('blocked-account', {
            type: 2,
            fromAuth: true
          });
          break;

        case 'need_validation':
          emit('confirm', {
            ...data,
            login: state.login,
            password: state.password
          });
          break;

        default:
          emit('auth', data.access_token);
          break;
      }
    }

    function setAccount(id) {
      store.commit('users/setActiveUser', id);
    }

    return {
      ...toRefs(state),

      setAccount,
      getPhoto,
      auth
    };
  }
};
</script>

<style>
.auth {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.auth input {
  margin-bottom: 6px;
}

.auth_logo {
  width: 125px;
  height: 125px;
}

.auth_name {
  font-size: 19px;
  margin: 15px 0 30px 0;
}

.auth_password_wrap {
  position: relative;
}

.auth_password_wrap input {
  padding-right: 30px;
}

.auth_password_switch {
  position: absolute;
  top: 0;
  right: 0;
  cursor: pointer;
  opacity: .8;
  width: 36px;
  height: 36px;
  background: url('~assets/show.svg') 50% no-repeat;
  transition: opacity .3s;
}

.auth_password_switch:hover {
  opacity: 1;
}

.auth_password_switch.hidden {
  background-image: url('~assets/hide.svg');
}

.auth_button {
  width: 250px;
}

.auth_users {
  position: relative;
  display: flex;
  margin-top: 25px;
  top: 10px;
}

.auth_user:not(:last-child) {
  margin-right: 15px;
}

.auth_user {
  border-radius: 10px;
}

.auth_user img {
  display: block;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  margin-bottom: 4px;
  cursor: pointer;
}
</style>
