<template>
  <div class="ripple_outer" @mousedown.left="addRipple">
    <div class="ripples">
      <TransitionGroup name="ripple">
        <div
          v-for="ripple in ripples"
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
import { ref } from 'vue';

export default {
  setup(props) {
    const ripples = ref([]);

    function addRipple(event) {
      const { left, top } = this.$el.getBoundingClientRect();
      const { offsetWidth, offsetHeight } = this.$el;
      const rippleWidth = offsetWidth > offsetHeight ? offsetWidth : offsetHeight;
      const halfRippleWidth = rippleWidth / 2;

      ripples.value.push({
        width: `${rippleWidth}px`,
        height: `${rippleWidth}px`,
        left: `${event.clientX - left - halfRippleWidth}px`,
        top: `${event.clientY - top - halfRippleWidth}px`,
        id: Date.now()
      });

      window.addEventListener('mouseup', () => {
        ripples.value = [];
      }, { once: true });
    }

    return {
      color: props.color || 'rgba(255, 255, 255, .3)',
      ripples,
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

.ripple-enter-active,
.ripple-enter-to-active {
  transition: all 1.5s ease-out;
}

.ripple-leave-active,
.ripple-leave-to-active {
  transition: all .7s ease-out;
}

.ripple_fast .ripple-enter-active,
.ripple_fast .ripple-enter-to-active {
  transition: all 1s ease-out;
}

.ripple_fast .ripple-leave-active,
.ripple_fast .ripple-leave-to-active {
  transition: all .4s ease-out;
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
</style>
