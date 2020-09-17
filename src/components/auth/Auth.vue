<template>
  <AuthForm v-if="!isConfirm" @confirm="onConfirm" @auth="onAuth" />
  <AuthConfirm v-else :params="params" @back="onBack" @auth="onAuth" />
</template>

<script>
import { reactive, toRefs } from 'vue';
import router from 'js/router';
import { loadUser } from '.';

import AuthForm from './AuthForm.vue';
import AuthConfirm from './AuthConfirm.vue';

export default {
  components: {
    AuthForm,
    AuthConfirm
  },

  setup() {
    const onlyAddUser = !!router.currentRoute.value.query.onlyAddUser;
    const state = reactive({
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
      loadUser(access_token, onlyAddUser);
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
