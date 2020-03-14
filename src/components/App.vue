<template>
  <div :class="['root', { mac }]">
    <Titlebar />

    <div class="app">
      <!-- TODO (vue-router) KeepAlive -->
      <RouterView />
    </div>
  </div>
</template>

<script>
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

import Titlebar from './Titlebar.vue';

export default {
  components: {
    Titlebar
  },

  setup() {
    const router = useRouter();
    const store = useStore();
    const activeUser = computed(() => store.state.users.activeUser);

    function replaceTo(path) {
      if (router.currentRoute.value.path !== path) {
        router.replace(path);
      }
    }

    function changeRoute() {
      if (activeUser.value) {
        replaceTo('/messages');
      } else {
        replaceTo('/auth');
      }
    }

    onMounted(() => {
      changeRoute();
    });

    watch(activeUser, changeRoute);

    return {
      mac: process.platform === 'darwin'
    };
  }
};
</script>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

:focus {
  outline: none;
}

@font-face {
  font-family: Roboto;
  font-weight: 400;
  font-display: block;
  src: url('~assets/Roboto.ttf');
}

@font-face {
  font-family: Roboto;
  font-weight: 500;
  font-display: block;
  src: url('~assets/RobotoMedium.ttf');
}

body {
  font-family: BlinkMacSystemFont, Roboto;
  font-size: 15px;
  margin: 0;
  overflow: hidden;
  height: 100vh;
  -webkit-rtl-ordering: visual;
  text-rendering: optimizeSpeed;
  background: #fff;
  user-select: none;
}

img:not(.emoji) {
  -webkit-user-drag: none;
  user-select: none;
}

.app {
  height: calc(100vh - var(--titlebar-height));
  position: relative;
}

.root {
  --titlebar-height: 32px;
}

.root.mac {
  --titlebar-height: 22px;
}

.link {
  color: #306aab;
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}

.input {
  width: 250px;
  outline: none;
  border: 1px solid #d2d8de;
  border-radius: 5px;
  font-size: 15px;
  color: #3c3c3c;
  line-height: 32px;
  height: 34px;
  padding: 0 9px;
  transition: border-color .3s;
}

.input:disabled {
  color: #999;
}

.input:hover {
  border: 1px solid #a2a5a8;
}

.input:focus {
  border: 1px solid #7e7f7f;
}

.input::-webkit-input-placeholder {
  color: #a0a0a0;
}
</style>
