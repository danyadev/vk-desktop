<template>
  <div>
    <div class="settings_line">
      {{ l('settings_dark_theme') }}
      <Checkbox />
    </div>
  </div>
</template>

<script>
  import Checkbox from '../../UI/Checkbox.vue';

  export default {
    components: {
      Checkbox
    }
  }
</script>

<style>

</style>
