<template>
  <div>
    <div class="settings_line clickable" @click="toggleDarkMode">
      {{ l('settings_dark_mode') }}
      <Checkbox :active="darkMode" />
    </div>
  </div>
</template>

<script>
  import Checkbox from '../../UI/Checkbox.vue';

  export default {
    components: {
      Checkbox
    },

    data: () => ({
      // Временно
      darkMode: false
    }),

    methods: {
      toggleDarkMode() {
        this.darkMode = !this.darkMode;
      }
    }
  }
</script>

<style>

</style>
