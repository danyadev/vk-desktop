<template>
  <Ripple :color="isLight ? '#ced7e0' : 'rgba(0, 0, 0, .15)'"
          :class="['button', { light: isLight, disabled }]"
          v-on="$listeners"
  >
    <slot></slot>
  </Ripple>
</template>

<script>
  import Ripple from './Ripple.vue';

  export default {
    props: ['light', 'disabled'],
    components: {
      Ripple
    },
    computed: {
      isLight() {
        return this.light != null;
      }
    }
  }
</script>

<style>
  .button {
    display: inline-block;
    padding: 9px;
    border-radius: 5px;
    user-select: none;
    text-align: center;
    transition: opacity .3s, background-color .3s;
  }

  .button:not(.disabled) {
    cursor: pointer;
  }

  .button.disabled {
    pointer-events: none;
    opacity: .8;
  }

  .button {
    background: #5789c5;
    color: #f3f3f3;
  }

  .button.light {
    background: #e4eaf0;
    color: #55677d;
  }

  .button:not(.disabled):hover { background: #547fb3 }
  .button.light:not(.disabled):hover { background: #dbe3eb }
</style>
