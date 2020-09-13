<template>
  <div class="section_container audios_container">
    <div class="audios_text">
      {{ l('audios_not_implemented') }}
    </div>

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
  flex-direction: column;
}

.audios_text {
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: center;
}
</style>
