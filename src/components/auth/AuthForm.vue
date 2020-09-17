<template>
  <div class="auth" @keydown.enter="auth">
    <img src="~assets/logo.webp" class="auth_logo">
    <div class="auth_name">{{ l('vk_desktop') }}</div>
    <input
      ref="input"
      v-model="login"
      :class="['input', { error }]"
      type="text"
      :placeholder="l('enter_login')"
    >
    <div class="auth_password_wrap">
      <input
        v-model="password"
        :class="['input', { error }]"
        :type="hidePassword ? 'password' : 'text'"
        :placeholder="l('enter_password')"
      >
      <div
        :class="['auth_password_switch', { hidden: hidePassword }]"
        @click="hidePassword = !hidePassword"
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
import { getAndroidToken, loadUser } from '.';

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

      loading: false,
      error: false,
      hidePassword: true,

      canAuth: computed(() => !state.loading && state.login && state.password),
      hasUsers: computed(() => !props.isModal && Object.keys(store.state.users.users).length)
    });

    async function auth() {
      if (!state.canAuth) {
        return;
      }

      state.loading = true;

      const data = await getAndroidToken(state.login, state.password);

      if (data.error === 'invalid_client') {
        state.loading = false;

        state.error = true;
        await onTransitionEnd(state.input);
        await timer(500);
        state.error = false;
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
