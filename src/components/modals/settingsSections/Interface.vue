<template>
  <div class="settings_line clickable" @click="toggle('showAvatarsAtBottom')">
    {{ l('ml_settings_options', 'show_avatar_at_bottom') }}
    <Checkbox :active="settings.showAvatarsAtBottom" />
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

  <div class="settings_line clickable" @click="toggleDarkTheme">
    {{ l('ml_settings_options', 'use_dark_theme') }}
    <Checkbox :active="settings.useDarkTheme" />
  </div>
</template>

<script>
import remoteElectron from '@electron/remote';
import { computed } from 'vue';
import store from 'js/store';
import { openModal } from 'js/modals';

import Checkbox from '@/UI/Checkbox.vue';

export default {
  components: {
    Checkbox
  },

  setup() {
    const settings = computed(() => store.getters['settings/settings']);
    const { mainSettings } = store.state;

    function toggle(name) {
      store.commit('settings/updateCommonSettings', {
        [name]: !settings.value[name]
      });
    }

    function toggleMain(name) {
      store.commit('mainSettings/updateSettings', {
        [name]: !mainSettings[name]
      });

      openModal('reload-app');
    }

    function toggleDarkTheme() {
      toggle('useDarkTheme');

      remoteElectron.nativeTheme.themeSource = settings.value.useDarkTheme
        ? 'dark'
        : 'light';
    }

    return {
      settings,
      toggle,
      mainSettings,
      toggleMain,
      toggleDarkTheme
    };
  }
};
</script>
