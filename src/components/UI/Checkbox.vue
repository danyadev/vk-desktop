<template>
  <div :class="['checkbox', { active: $props.active }]">
    <Icon v-if="$props.active" name="done" color="#fff" />
  </div>
</template>

<script>
import Icon from './Icon.vue';

export default {
  components: {
    Icon
  }
}
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
  background: #648fc1;
}

.checkbox:not(.active) {
  border: 2px solid #bdbdbd;
}
</style>
