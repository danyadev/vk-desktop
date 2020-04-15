<template>
  <div class="auth auth_code" @keydown.enter="auth">
    <div class="auth_code_header">{{ l('security_check') }}</div>
    <div class="auth_code_descr">{{ l('code_sent_to', isAppCode, [phoneMask]) }}</div>
    <input ref="input" v-model="code" :class="['input', { error }]" :placeholder="l('enter_code')">
    <div class="auth_code_buttons">
      <Button light :disabled="loading" @click="$emit('back')">{{ l('cancel') }}</Button>
      <Button :disabled="!canAuth" @click="auth">{{ l('login') }}</Button>
    </div>
    <div class="auth_use_sms link" :class="{ hidden: disableForceSMS }" @click="enableForceSms">
      {{
        timeToSendSMS
          ? l('retry_send_sms', [format(timeToSendSMS, 'mm:ss')])
          : l('use_force_sms')
      }}
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs, onMounted } from 'vue';
import { onTransitionEnd, timer } from 'js/utils';
import { format } from 'js/date/utils';
import vkapi from 'js/vkapi';
import { getAndroidToken, loadUser } from '.';

import Button from '../UI/Button.vue';

export default {
  props: ['isModal', 'params'],

  components: {
    Button
  },

  setup(props) {
    const state = reactive({
      isAppCode: props.params.validation_type === '2fa_app',
      phoneMask: props.params.phone_mask,
      loading: false,
      error: false,
      code: '',
      canAuth: computed(() => !state.loading && state.code.trim()),
      timeToSendSMS: null,
      disableForceSMS: false,
      input: null
    });

    onMounted(() => {
      updateTimer(120);
      state.input.focus();
    });

    function updateTimer(time) {
      if (time) {
        state.timeToSendSMS = new Date(time * 1000);

        setTimeout(() => {
          updateTimer(--time);
        }, 1000);
      } else {
        state.timeToSendSMS = null;
      }
    }

    async function auth() {
      if (!state.canAuth) {
        return;
      }

      state.loading = true;

      const data = await getAndroidToken(props.params.login, props.params.password, {
        code: state.code
      });

      if (data.error === 'invalid_request') {
        state.loading = false;

        state.error = true;
        await onTransitionEnd(state.input);
        await timer(500);
        state.error = false;
      } else {
        loadUser(data.access_token, props.isModal);
      }
    }

    async function enableForceSms() {
      if (state.timeToSendSMS) {
        return;
      }

      state.loading = true;

      try {
        const data = await vkapi('auth.validatePhone', {
          client_secret: 'hHbZxrka2uZ6jB1inYsH',
          client_id: 2274003,
          api_id: 2274003,
          sid: props.params.validation_sid
        });

        state.isAppCode = false;
        updateTimer(data.delay);
      } catch (err) {
        state.disableForceSMS = true;
      }

      state.loading = false;
    }

    return {
      ...toRefs(state),

      auth,
      enableForceSms,
      format
    };
  }
};
</script>

<style>
.auth_code_header {
  font-size: 24px;
  margin-bottom: 20px;
}

.auth_code_descr {
  margin-bottom: 20px;
  width: 330px;
}

.auth_code_buttons {
  margin-bottom: 25px;
}

.auth_code_buttons .button {
  width: 123px;
  margin: 2px;
}

.auth_use_sms {
  position: absolute;
  bottom: 10px;
  width: 100%;
  text-align: center;
  transition: opacity .3s;
}

.auth_use_sms.hidden {
  opacity: 0;
  pointer-events: none;
}
</style>
