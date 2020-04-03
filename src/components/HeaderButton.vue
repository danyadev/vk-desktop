<template>
  <img src="assets/menu.webp" class="open_menu_btn" @click="openMenu">
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
  width: 20px;
  height: 20px;
  margin: 10px;
  border-radius: 50%;
  cursor: pointer;
  opacity: .7;
  transition: opacity .3s;
}

.open_menu_btn:hover {
  opacity: 1;
}
</style>
