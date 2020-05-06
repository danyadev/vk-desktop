<template>
  <div class="snackbars">
    <TransitionGroup name="snackbar">
      <div v-for="snackbar of snackbars" :key="snackbar.id" class="snackbar">
        <Icon
          v-if="snackbar.icon"
          :name="snackbar.icon"
          :color="snackbar.color || 'var(--icon-blue)'"
          width="24"
          height="24"
        />

        {{ snackbar.text }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { snackbarsState } from 'js/snackbars';

import Icon from './UI/Icon.vue';

export default {
  components: {
    Icon
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
  transform: translateY(10px);
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
  padding-bottom: 20px;
}

.snackbar {
  display: flex;
  align-items: center;
  position: relative;
  padding: 5px 12px;
  margin-top: 10px;
  max-width: 80%;
  min-height: 45px;
  max-height: 200px;
  background: var(--background);
  border: 1px solid var(--separator-dark);
  border-radius: 10px;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, .24),
              0 0 2px 0 rgba(0, 0, 0, .08);
}

.snackbar svg {
  margin-right: 10px;
}
</style>
