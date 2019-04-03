<template>
  <div class="open_menu" @click="openMenu">
    <img v-if="showBackIcon" src="~assets/back.svg">
    <img v-else src="~assets/menu.png">
  </div>
</template>

<script>
  export default {
    computed: {
      showBackIcon() {
        // TODO: vue router history length (if > 1 then true)
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
    cursor: pointer;
    opacity: .7;
    transition: opacity .3s;
  }

  .open_menu:hover { opacity: 1 }
</style>
