<template>
  <div class="auth auth_code" @keydown.enter="auth">
    <div class="auth_code_header">{{ l('security_check') }}</div>
    <div class="auth_code_descr">{{ l('code_sent_to', isAppCode, [phoneMask]) }}</div>
    <input v-model="code" class="input" :placeholder="l('enter_code')">
    <div class="auth_code_buttons">
      <Button light :disabled="loading" @click="cancel">{{ l('cancel') }}</Button>
      <Button :disabled="!canAuth" @click="auth">{{ l('login') }}</Button>
    </div>
    <div :class="['auth_error', { active: wrongCode }]">{{ l('wrong_code') }}</div>
    <div :class="['auth_use_sms link', { hidden: !isAppCode }]" @click="enableForceSms">
      {{ l('use_force_sms') }}
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import router from 'js/router';
import vkapi from 'js/vkapi';
import { getAndroidToken, loadUser } from '.';

import Button from '../UI/Button.vue';

export default {
  components: {
    Button
  },

  setup(props) {
    const { params } = router.currentRoute.value.params;

    const state = reactive({
      isAppCode: params.validation_type === '2fa_app',
      phoneMask: params.phone_mask,
      loading: false,
      wrongCode: false,
      code: '',
      canAuth: computed(() => !state.loading && state.code.trim())
    });

    async function auth() {
      if (!state.canAuth) return;

      state.loading = true;
      state.wrongCode = false;

      const data = await getAndroidToken(params.login, params.password, {
        code: state.code
      });

      if (data.error === 'invalid_request') {
        state.loading = false;
        state.wrongCode = true;
      } else {
        loadUser(data.access_token, props.isModal);
      }
    }

    function cancel() {
      router.replace('/auth');
    }

    async function enableForceSms() {
      state.loading = true;
      state.wrongCode = false;
      state.isAppCode = false;

      try {
        await vkapi('auth.validatePhone', {
          client_secret: 'hHbZxrka2uZ6jB1inYsH',
          client_id: 2274003,
          api_id: 2274003,
          sid: params.validation_sid
        });
      } catch (e) {
        state.isAppCode = true;
      }

      state.loading = false;
    }

    return {
      ...toRefs(state),
      auth,
      cancel,
      enableForceSms
    };
  }
};
</script>

<style>
.auth_code_header {
  font-size: 24px;
  margin-bottom: 10px;
}

.auth_code_descr {
  font-size: 14px;
  margin-bottom: 20px;
  width: 310px;
}

.auth_code_buttons .button {
  width: 123px;
  margin: 2px;
}

.auth_code .auth_error {
  margin: 2px;
}

.auth_use_sms {
  position: absolute;
  bottom: 10px;
  transition: opacity .3s;
}

.auth_use_sms.hidden {
  opacity: 0;
}
</style>
