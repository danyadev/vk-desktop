<template>
  <div class="settings_line clickable" @click="toggle('devShowObjectIds')">
    {{ l('ml_settings_show_object_ids') }}
    <Checkbox :active="settings.devShowObjectIds" />
  </div>
</template>

<script>
import { computed } from 'vue';
import store from 'js/store';

import Checkbox from '../../UI/Checkbox.vue';

export default {
  components: {
    Checkbox
  },

  setup() {
    const settings = computed(() => store.getters['settings/settings']);

    function toggle(name) {
      store.commit('settings/updateUserSettings', {
        [name]: !settings.value[name]
      });
    }

    return {
      settings,
      toggle
    };
  }
};
</script>
