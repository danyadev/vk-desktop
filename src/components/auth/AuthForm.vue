<template>
  <div class="auth" @keydown.enter="auth">
    <img src="~assets/logo.webp" class="auth_logo">
    <div class="auth_name">{{ l('vk_desktop') }}</div>
    <input
      ref="input"
      v-model="login"
      :class="['input', { error: error.login }]"
      type="text"
      :placeholder="l('enter_login')"
    >
    <div class="auth_password_wrap">
      <input
        v-model="password"
        :class="['input', { error: error.password }]"
        :type="hidePassword ? 'password' : 'text'"
        :placeholder="l('enter_password')"
      >
      <div
        :class="['auth_password_switch', { hidden: hidePassword }]"
        @click="hidePassword = !hidePassword"
      />
    </div>
  
    <hr class="split_token">
    <div class="auth_token_wrap">
      <input
        v-model="myToken"
        :class="['input', { error: error.token }]"
        :type="hideToken ? 'password' : 'text'"
        :placeholder="l('or_enter_token')"
      >
      <div
        :class="['auth_password_switch', { hidden: hideToken }]"
        @click="hideToken = !hideToken"
      />
    </div>

    <Button class="auth_button" :disabled="!canAuth" @click="auth">{{ l('login') }}</Button>

    <div v-if="hasUsers" class="link auth_open_multiacc" @click="openModal('multiaccount')">
      {{ l('available_accounts_list') }}
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs, onMounted } from 'vue';
import { onTransitionEnd, timer } from 'js/utils';
import { openModal } from 'js/modals';
import store from 'js/store';
import { getAndroidToken, loadUser, getUserByToken } from '.';

import Button from '../UI/Button.vue';

export default {
  props: ['isModal'],

  emits: ['confirm'],

  components: {
    Button
  },

  setup(props, { emit }) {
    const state = reactive({
      input: null,

      login: '',
      password: '',
      myToken: '',

      loading: false,
      error: {
        login: false,
        password: false,
        token: false,
      },
      hidePassword: true,
      hideToken: true,

      authByToken: false,

      canAuth: computed(() => !state.loading && (state.login && state.password || state.myToken)),
      hasUsers: computed(() => !props.isModal && Object.keys(store.state.users.users).length)
    });

    async function auth() {
      if (!state.canAuth) {
        return;
      }

      state.loading = true;

      if (state.myToken) {
        try {
          const data = await getUserByToken(state.myToken);
          console.log('user data', data);
          loadUser(state.myToken, props.isModal);
        } catch (error) {
          state.loading = false;

          state.error.token = true;
          await onTransitionEnd(state.input);
          await timer(500);
          state.error.token = false;
        }
        return;
      }

      const data = await getAndroidToken(state.login, state.password);

      if (data.error === 'invalid_client') {
        state.loading = false;

        state.error.login = true;
        state.error.password = true;
        await onTransitionEnd(state.input);
        await timer(500);
        state.error.login = false;
        state.error.password = false;
      } else if (data.error === 'account_banned') {
        state.loading = false;

        openModal('blocked-account', {
          fromAuth: true
        });
      } else if (data.error === 'need_validation') {
        emit('confirm', {
          ...data,
          login: state.login,
          password: state.password
        });
      } else {
        loadUser(data.access_token, props.isModal);
      }
    }

    onMounted(() => {
      state.input.focus();
    });

    return {
      ...toRefs(state),

      auth,
      openModal
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

.split_token {
  width: 250px;
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

.auth_token_wrap {
  position: relative;
}

.auth_token_wrap input {
  padding-right: 30px;
}

.auth_password_switch {
  position: absolute;
  top: 0;
  right: 0;
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

.auth_open_multiacc {
  position: absolute;
  bottom: 10px;
}
</style>
