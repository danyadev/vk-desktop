<template>
  Ура, @{{ user.domain }}, ты успешно авторизовался!
</template>

<script>
import { useStore } from 'vuex';

export default {
  setup() {
    const store = useStore();

    return {
      user: store.getters['users/user']
    };
  }
};
</script>
