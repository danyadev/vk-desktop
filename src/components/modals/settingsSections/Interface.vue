<template>
  <div class="settings_line clickable" @click="toggle('showAvatarAtBottom')">
    {{ l('ml_settings_options', 'show_avatar_at_bottom') }}
    <Checkbox :active="settings.showAvatarAtBottom" />
  </div>

  <div class="settings_line clickable" @click="toggle('useLightMessageColors')">
    {{ l('ml_settings_options', 'use_light_message_colors') }}
    <Checkbox :active="settings.useLightMessageColors" />
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
