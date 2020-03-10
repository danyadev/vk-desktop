<template>
  <div class="context_menu" :style="style">
    <slot />
  </div>
</template>

<script>
  export default {
    data: () => ({
      style: null
    }),

    async mounted() {
      // Дожидаемся полного рендера элемента, чтобы получить
      // полную высоту и ширину элемента
      await this.$nextTick();
      await this.$nextTick();

      const [titlebar, app] = this.$root.$el.children;
      const { clientWidth, clientHeight } = app;
      const { width, height } = this.$el.getBoundingClientRect();

      let { x, y } = this.$store.state.contextMenuEvent;

      // Вычитаем из координаты высоту тайтлбара, т.к.
      // враппер контекстного меню имеет высоту в виде
      // <высота приложения> - <высота тайтлбара>,
      // а в event приходят координаты с верхней точки приложения
      y = y - titlebar.clientHeight;

      const dx = clientWidth - x;
      const dy = clientHeight - y;

      if(dx < width) x = Math.max(10, x - width);
      if(dy < height) y = Math.max(10, y - height);

      this.style = {
        left: `${x}px`,
        top: `${y}px`
      };
    }
  }
</script>

<style>
  .context_menu {
    position: relative;
    width: 250px;
    padding: 6px 0;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 0 4px rgba(0, 0, 0, .2),
                0 4px 36px -6px rgba(0, 0, 0, .4);
  }
</style>
