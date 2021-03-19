<template>
  <div ref="outer" class="ripple_outer" @mousedown.left="addRipple">
    <div class="ripples">
      <TransitionGroup name="ripple">
        <div
          v-for="ripple of ripples"
          :key="ripple.id"
          class="ripple"
          :style="{
            top: ripple.top,
            left: ripple.left,
            width: ripple.width,
            height: ripple.height,
            background: color
          }"
        />
      </TransitionGroup>
    </div>

    <slot />
  </div>
</template>

<script>
import { reactive, toRefs } from 'vue';

export default {
  props: {
    color: {
      type: String,
      default: 'rgba(255, 255, 255, .3)'
    }
  },

  setup() {
    const state = reactive({
      outer: null,
      ripples: []
    });

    function addRipple(event) {
      const { left, top } = state.outer.getBoundingClientRect();
      const { offsetWidth, offsetHeight } = state.outer;
      const rippleWidth = offsetWidth > offsetHeight ? offsetWidth : offsetHeight;
      const halfRippleWidth = rippleWidth / 2;
      const now = Date.now();

      state.ripples.push({
        width: `${rippleWidth}px`,
        height: `${rippleWidth}px`,
        left: `${event.clientX - left - halfRippleWidth}px`,
        top: `${event.clientY - top - halfRippleWidth}px`,
        id: now
      });

      window.addEventListener('mouseup', () => {
        setTimeout(
          () => (state.ripples = []),
          Math.max(250 - (Date.now() - now), 0)
        );
      }, { once: true });
    }

    return {
      ...toRefs(state),
      addRipple
    };
  }
};
</script>

<style>
.ripple_outer {
  position: relative;
  z-index: 1;
  overflow: hidden;
  cursor: pointer;
}

.ripples, .ripple {
  position: absolute;
  width: 100%;
  height: 100%;
}

.ripples {
  top: 0;
  left: 0;
  z-index: -1;
  pointer-events: none;
}

.ripple {
  border-radius: 50%;
  opacity: 0;
}

.ripple-enter-from {
  transform: scale(0);
  opacity: 1;
}

.ripple-enter-to,
.ripple-leave-from {
  transform: scale(4);
  opacity: 1;
}

.ripple-leave-to {
  transform: scale(4);
  opacity: 0;
}

.ripple-enter-active,
.ripple-enter-to-active {
  transition: all 1.5s ease-out;
}

.ripple-leave-active,
.ripple-leave-to-active {
  transition: all .7s ease-out;
}

.fast-ripple .ripple-enter-active,
.fast-ripple .ripple-enter-to-active {
  transition: all 1s ease-out;
}

.fast-ripple .ripple-leave-active,
.fast-ripple .ripple-leave-to-active {
  transition: all .4s ease-out;
}
</style>
