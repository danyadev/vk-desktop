<template>
  <div
    ref="root"
    class="touch"
    @touchstart="onTouchStart"
    @touchmove.passive="onTouchMove"
    @mousedown="onMouseDown"
  >
    <slot />
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    const root = ref(null);
    let touchX;

    function onTouchStart({ touches: [touch] }) {
      // Запрещаем активацию скроллбаров, которые находятся над этим компонентом
      event.stopPropagation();
      touchX = touch.pageX;
    }

    function onTouchMove({ touches: [touch] }) {
      event.stopPropagation();

      const dx = touchX - touch.pageX;
      touchX = touch.pageX;

      requestAnimationFrame(() => {
        root.value.scrollLeft += dx;
      });
    }

    function onMouseDown({ x: startX }) {
      let lastX = startX;

      function onMouseMove({ x }) {
        const diff = lastX - x;
        lastX = x;

        requestAnimationFrame(() => {
          root.value.scrollLeft += diff;
        });
      };

      function onMouseUp() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return {
      root,
      onTouchStart,
      onTouchMove,
      onMouseDown
    };
  }
};
</script>

<style>
.touch {
  overflow: hidden;
}
</style>
