<template>
  <div :class="['checkbox', { active }]">
    <img v-if="active" src="~assets/done.svg">
  </div>
</template>

<script>
  export default {
    props: ['active']
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
    background: var(--checkbox-active);
  }

  .checkbox:not(.active) {
    border: 2px solid var(--text-secondary);
  }

  .checkbox img {
    width: 18px;
    height: 18px;
  }
</style>
