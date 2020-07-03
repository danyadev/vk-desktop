<template>
  <div class="section_container audios_container">
    {{ l('audios_not_implemented') }}

    <BottomMenu />
  </div>
</template>

<script>
import BottomMenu from '../menu/BottomMenu.vue';

export default {
  components: {
    BottomMenu
  }
};
</script>

<style>
.audios_container {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
