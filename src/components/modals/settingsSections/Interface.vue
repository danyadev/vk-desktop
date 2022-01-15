<template>
  <div class="settings_line clickable" @click="toggle('showAvatarAtBottom')">
    {{ l('ml_settings_options', 'show_avatar_at_bottom') }}
    <Checkbox :active="settings.showAvatarAtBottom" />
  </div>

  <div class="settings_line clickable" @click="toggle('animateStickersOnFirstAppear')">
    {{ l('ml_settings_options', 'animate_stickers_on_first_appear') }}
    <Checkbox :active="settings.animateStickersOnFirstAppear" />
  </div>

  <div class="settings_line clickable" @click="toggle('useMoreSaturatedColors')">
    {{ l('ml_settings_options', 'use_more_saturated_colors') }}
    <Checkbox :active="settings.useMoreSaturatedColors" />
  </div>

  <div class="settings_line clickable" @click="toggle('useNativeEmoji')">
    {{ l('ml_settings_options', 'use_native_emoji') }}
    <Checkbox :active="settings.useNativeEmoji" />
  </div>

  <div class="settings_line clickable" @click="toggleMain('useNativeTitlebar')">
    {{ l('ml_settings_options', 'use_native_titlebar') }}
    <Checkbox :active="mainSettings.useNativeTitlebar" />
  </div>
</template>

<script>
import { computed } from 'vue';
import store from 'js/store';
import { openModal } from 'js/modals';

import Checkbox from '../../UI/Checkbox.vue';

export default {
  components: {
    Checkbox
  },

  setup() {
    const settings = computed(() => store.getters['settings/settings']);
    const { mainSettings } = store.state;

    function toggle(name) {
      store.commit('settings/updateUserSettings', {
        [name]: !settings.value[name]
      });
    }

    function toggleMain(name) {
      store.commit('mainSettings/updateSettings', {
        [name]: !mainSettings[name]
      });

      openModal('reload-app');
    }

    return {
      settings,
      toggle,
      mainSettings,
      toggleMain
    };
  }
};
</script>
