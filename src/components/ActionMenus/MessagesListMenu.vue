<template>
  <ActionsMenu>
    <div class="act_menu_item" @click="setDarkTheme">
      <img src="~assets/palette.svg" class="act_menu_icon">
      <div class="act_menu_data">{{ l('dark_theme', isDarkTheme) }} (beta)</div>
    </div>
  </ActionsMenu>
</template>

<script>
  import ActionsMenu from './ActionsMenu.vue';

  export default {
    components: {
      ActionsMenu
    },
    computed: {
      isDarkTheme() {
        return this.$store.state.settings.theme == 'dark';
      }
    },
    methods: {
      setDarkTheme() {
        this.$store.commit('settings/setTheme', this.isDarkTheme ? 'light' : 'dark');
      }
    }
  }
</script>
