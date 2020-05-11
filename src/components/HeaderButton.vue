<template>
  <img src="assets/menu.svg" class="open_menu_btn icon-hover" @click="openMenu">
</template>

<script>
import store from 'js/store';

export default {
  methods: {
    openMenu() {
      store.commit('setMenuState', true);
    }
  }
};
</script>

<style>
.open_menu_btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 40px;
  height: 50px;
  padding: 15px 10px;
  border-radius: 50%;
}
</style>
