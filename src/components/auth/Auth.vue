<template>
  <Icon
    v-if="onlyAddUser"
    name="cancel"
    color="var(--icon-gray)"
    class="auth_cancel"
    @click="$router.go(-1)"
  />

  <AuthForm v-if="!isConfirm" :onlyAddUser="onlyAddUser" @confirm="onConfirm" @auth="onAuth" />
  <AuthConfirm v-else :params="params" @back="onBack" @auth="onAuth" />
</template>

<script>
import { reactive, toRefs } from 'vue';
import router from 'js/router';
import { loadUser } from '.';

import Icon from '../UI/Icon.vue';
import AuthForm from './AuthForm.vue';
import AuthConfirm from './AuthConfirm.vue';

export default {
  components: {
    Icon,
    AuthForm,
    AuthConfirm
  },

  setup() {
    const state = reactive({
      onlyAddUser: !!router.currentRoute.value.query.onlyAddUser,
      isConfirm: false,
      params: null
    });

    function onConfirm(params) {
      state.isConfirm = true;
      state.params = params;
    }

    function onBack() {
      state.isConfirm = false;
    }

    function onAuth(access_token) {
      loadUser(access_token, state.onlyAddUser);
    }

    return {
      ...toRefs(state),

      onConfirm,
      onBack,
      onAuth
    };
  }
};
</script>

<style>
.auth_cancel {
  position: absolute;
  right: 20px;
  top: 20px;
  transition: color .2s;
  cursor: pointer;
}

.auth_cancel:hover {
  color: var(--icon-dark-gray);
}
</style>
