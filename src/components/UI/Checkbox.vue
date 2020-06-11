<template>
  <div :class="['checkbox', { active }]">
    <Icon v-if="active" name="done" color="var(--background-blue-text)" />
  </div>
</template>

<script>
import Icon from './Icon.vue';

export default {
  props: ['active'],

  components: {
    Icon
  }
};
</script>

<style>
.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 5px;
}

.checkbox.active {
  background: var(--icon-blue);
}

.checkbox:not(.active) {
  border: 2px solid var(--icon-gray);
}
</style>
