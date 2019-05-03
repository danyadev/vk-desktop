<template>
  <Ripple color="rgba(255, 255, 255, .2)" class="fast open_menu" @click="openMenu">
    <img v-if="showBackIcon" src="~assets/back.svg">
    <img v-else src="~assets/menu.png">
  </Ripple>
</template>

<script>
  import Ripple from '@vkdesktop/vue-ripple';

  export default {
    components: {
      Ripple
    },
    computed: {
      showBackIcon() {
        // TODO: vue router history length (if n > 1 то true)
        return false;
      }
    },
    methods: {
      openMenu() {
        this.$store.commit('setMenuState', true);
      }
    }
  }
</script>

<style scoped>
  .open_menu {
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

  .open_menu:hover { opacity: 1 }
</style>
