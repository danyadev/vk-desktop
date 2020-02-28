<template>
  <Ripple :color="isLight ? 'var(--button-light-background)' : 'var(--button-primary-background)'"
          :class="['button', { light: isLight, disabled }]"
          v-on="$listeners"
  >
    <slot />
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
    background: var(--button-primary-background);
    color: var(--button-primary-foreground);
  }

  .button.light {
    background: var(--button-light-background);
    color: var(--button-light-foreground);
  }

  .button:not(.disabled):hover { background: var(--button-primary-background-hover) }
  .button.light:not(.disabled):hover { background: var(--button-light-background-hover) }
</style>
