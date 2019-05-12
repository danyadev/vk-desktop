<template>
  <Ripple color="rgba(255, 255, 255, .2)" class="fast open_menu_btn" @click="openMenu">
    <img :src="back ? 'assets/back.svg' : 'assets/menu.png'">
  </Ripple>
</template>

<script>
  import Ripple from './UI/Ripple.vue';

  export default {
    props: {
      back: {
        type: Boolean,
        default: false
      }
    },
    components: {
      Ripple
    },
    methods: {
      openMenu() {
        // TODO: Действие при this.back = true
        this.$store.commit('setMenuState', true);
      }
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
