<template>
  <Ripple color="rgba(255, 255, 255, .2)" class="ripple_fast open_menu_btn" @click="openMenu">
    <img src="assets/menu.webp">
  </Ripple>
</template>

<script>
import store from 'js/store';
import Ripple from './UI/Ripple.vue';

export default {
  components: {
    Ripple
  },

  setup() {
    function openMenu() {
      store.commit('setMenuState', true);
    }

    return {
      openMenu
    };
  }
}
</script>

<style>
.open_menu_btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  opacity: .7;
  transition: opacity .3s;
}

.open_menu_btn:hover { opacity: 1 }
</style>
