<template>
  <div class="touch"
       @touchstart="onTouchStart"
       @touchmove.passive="onTouchMove"
       @mousedown="onMouseDown"
  >
    <slot />
  </div>
</template>

<script>
  export default {
    methods: {
      onTouchStart({ touches: [touch] }) {
        // Запрещаем активацию скроллбаров, которые находятся над этим компонентом
        event.stopPropagation();

        this.touchX = touch.pageX;
      },

      onTouchMove({ touches: [touch] }) {
        event.stopPropagation();

        const dx = this.touchX - touch.pageX;

        this.touchX = touch.pageX;

        requestAnimationFrame(() => {
          this.$el.scrollLeft += dx;
        });
      },

      onMouseDown({ x: startX }) {
        let lastX = startX;

        const onMouseMove = ({ x }) => {
          const diff = lastX - x;
          lastX = x;

          requestAnimationFrame(() => {
            this.$el.scrollLeft += diff;
          });
        };

        const onMouseUp = () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      }
    }
  }
</script>

<style>
  .touch {
    overflow: hidden;
  }
</style>
