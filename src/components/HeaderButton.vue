<template>
  <div class="open_menu" @click="openMenu">
    <!-- TODO: иконка назад -->
    <img src="~assets/menu.png">
  </div>
</template>

<script>
  export default {
    methods: {
      openMenu() {
        // this.$store.commit('setMenuState', true);
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
