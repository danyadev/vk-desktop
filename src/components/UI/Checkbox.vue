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
    width: 22px;
    height: 22px;
    border-radius: 5px;
  }

  .checkbox.active {
    background: #648fc1;
  }

  .checkbox:not(.active) {
    border: 2px solid #bdbdbd;
  }

  .checkbox img {
    width: 20px;
    height: 20px;
  }
</style>
