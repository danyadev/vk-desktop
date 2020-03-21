<template>
  <div class="settings_line clickable" @click="active = !active">
    Тестовый чекбокс
    <Checkbox :active="active" />
  </div>
</template>

<script>
import Checkbox from '../../UI/Checkbox.vue';

export default {
  components: {
    Checkbox
  },

  setup() {
    return {
      active: false
    };
  }
};
</script>
