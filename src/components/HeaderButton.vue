<template>
  <Ripple color="rgba(255, 255, 255, .2)" class="ripple_fast open_menu_btn" @click="openMenu">
    <img :src="`assets/${back ? 'back.svg' : 'menu.webp'}`">
  </Ripple>
</template>

<script>
  import Ripple from './UI/Ripple.vue';

  export default {
    props: ['back'],

    components: {
      Ripple
    },

    methods: {
      openMenu() {
        if(this.back) this.$emit('back');
        else this.$store.commit('setMenuState', true);
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
