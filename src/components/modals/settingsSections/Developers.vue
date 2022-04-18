<template>
  <div class="settings_line clickable" @click="toggle('showObjectIds')">
    {{ l('ml_settings_options', 'show_object_ids') }}
    <Checkbox :active="settings.showObjectIds" />
  </div>
</template>

<script>
import { computed } from 'vue';
import store from 'js/store';

import Checkbox from '@/UI/Checkbox.vue';

export default {
  components: {
    Checkbox
  },

  setup() {
    const settings = computed(() => store.getters['settings/settings']);

    function toggle(name) {
      store.commit('settings/updateCommonSettings', {
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
