<template>
  <div>
    <div class="settings_line clickable" @click="toggleDarkTheme">
      {{ l('settings_dark_theme') }}
      <Checkbox :active="darkTheme" />
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex';

  import Checkbox from '../../UI/Checkbox.vue';

  export default {
    components: {
      Checkbox
    },

    computed: {
      ...mapState('settings', ['darkTheme'])
    },

    methods: {
      toggleDarkTheme() {
        this.$store.commit('settings/toggleTheme');
      }
    }
  }
</script>

<style>

</style>
