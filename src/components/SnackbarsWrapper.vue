<template>
  <div class="snackbars">
    <Transition name="snackbar" mode="out-in">
      <div
        v-if="snackbar"
        :key="snackbar.id"
        class="snackbar"
        @mouseenter="snackbar.onMouseEnter"
        @mouseleave="snackbar.onMouseLeave"
      >
        <Icon
          v-if="snackbar.icon"
          :name="snackbar.icon"
          :color="snackbar.color || 'var(--icon-blue)'"
          width="24"
          height="24"
          class="snackbar_action_icon"
        />

        <div>
          <VKText preview>{{ snackbar.text }}</VKText>
        </div>

        <Icon
          v-if="snackbar.closable"
          name="close"
          color="var(--icon-dark-gray)"
          width="14"
          height="14"
          class="snackbar_close_icon"
          @click="snackbar.close"
        />
      </div>
    </Transition>
  </div>
</template>

<script>
import { snackbarsState } from 'js/snackbars';

import Icon from './UI/Icon.vue';
import VKText from './UI/VKText.vue';

export default {
  components: {
    Icon,
    VKText
  },

  setup() {
    return snackbarsState;
  }
};
</script>

<style>
.snackbar-enter-active, .snackbar-leave-active {
  transition: opacity .4s, transform .4s;
}

.snackbar-enter-from, .snackbar-leave-to {
  opacity: 0;
  transform: translateY(15px);
}

.snackbars {
  position: absolute;
  top: 0;
  z-index: 3;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  width: 100%;
  height: 100%;
  pointer-events: none;
  padding-bottom: 65px;
}

.snackbar {
  display: flex;
  align-items: center;
  text-align: center;
  padding: 0px 12px;
  max-width: 80%;
  min-height: 50px;
  pointer-events: auto;
  user-select: text;
  background: var(--background-accent);
  border: 1px solid var(--separator-dark);
  border-radius: 10px;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, .24),
              0 0 2px 0 rgba(0, 0, 0, .08);
}

.snackbar > div {
  overflow-wrap: break-word;
  overflow: auto;
  line-height: 20px;
  margin: 5px 0;
}

.snackbar_action_icon {
  flex: none;
  margin-right: 10px;
}

.snackbar_close_icon {
  flex: none;
  margin-left: 10px;
  cursor: pointer;
  opacity: .8;
  transition: opacity .3s;
}

.snackbar_close_icon:hover {
  opacity: 1;
}
</style>
