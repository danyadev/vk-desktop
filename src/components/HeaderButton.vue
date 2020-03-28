<template>
  <Ripple color="var(--blue-background-ripple)" class="open_menu_btn fast-ripple" @click="openMenu">
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
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  opacity: .7;
  transition: opacity .3s;
}

.open_menu_btn:hover {
  opacity: 1;
}
</style>
