<template>
  <div class="auth" @keydown.enter="auth">
    <img src="~assets/logo.webp" class="auth_logo">
    <div class="auth_name">VK Desktop</div>
    <input
      v-model="state.login"
      class="input"
      type="text"
      :placeholder="l('enter_login')"
    >
    <div class="auth_password_wrap">
      <input
        v-model="state.password"
        class="input"
        :type="state.hidePassword ? 'password' : 'text'"
        :placeholder="l('enter_password')"
      >
      <div
        :class="['auth_password_switch', { hidden: state.hidePassword }]"
        @click="state.hidePassword = !state.hidePassword"
      />
    </div>
    <Button class="auth_button" :disabled="!state.canAuth" @click="auth">{{ l('login') }}</Button>
    <div :class="['auth_error', { active: state.hasError }]">{{ state.errorText }}</div>
  </div>
</template>

<script>
import { reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import getTranslate from 'js/getTranslate';
import { getAndroidToken, loadUser } from '.';

import Button from '../UI/Button.vue';

export default {
  components: {
    Button
  },

  setup() {
    const router = useRouter();

    const state = reactive({
      login: '',
      password: '',
      errorText: '',
      loading: false,
      hidePassword: true,
      hasError: false,
      canAuth: computed(() => !state.loading && state.login && state.password)
    });

    async function auth() {
      if (!state.canAuth) return;

      state.hasError = false;
      state.loading = true;

      const data = await getAndroidToken(state.login, state.password);

      if (['invalid_client', 'account_banned'].includes(data.error)) {
        state.hasError = true;
        state.errorText = getTranslate('auth_errors', data.error);
      } else if (data.error === 'need_validation') {
        router.replace({
          path: '/auth/confirm',
          params: {
            params: {
              ...data,
              login: state.login,
              password: state.password
            }
          }
        });
      } else {
        loadUser(data.access_token);
      }

      state.loading = false;
    }

    return {
      state,
      auth
    };
  }
};
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

.auth input {
  margin-bottom: 6px;
}

.auth_error {
  padding: 8px 0;
  margin: 6px 0;
  width: 250px;
  height: 36px;
  color: #de3f3f;
  border: 1px solid #de3f3f;
  border-radius: 5px;
  opacity: 0;
  transition: opacity .3s;
}

.auth_error.active {
  opacity: 1;
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
  opacity: .8;
  width: 34px;
  height: 34px;
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
  color: #306aab;
  cursor: pointer;
}
</style>
