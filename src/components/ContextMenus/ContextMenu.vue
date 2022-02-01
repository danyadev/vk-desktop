<script>
import { h, ref, onMounted } from 'vue';

export default {
  props: ['event'],

  setup(props, { slots }) {
    const style = ref(null);
    const menu = ref(null);

    onMounted(() => {
      const [titlebar, app] = document.querySelector('.root').children;
      const { clientWidth, clientHeight } = app;
      const { width, height } = menu.value.getBoundingClientRect();

      let { x, y } = props.event;

      // Вычитаем из координаты высоту тайтлбара, т.к.
      // враппер контекстного меню имеет высоту в виде
      // <высота приложения> - <высота тайтлбара>,
      // а в event приходят координаты с верхней точки приложения
      y -= titlebar.clientHeight;

      const dx = clientWidth - x;
      const dy = clientHeight - y;

      if (dx < width) {
        x = Math.max(x - width, 10);
      }

      if (dy < height) {
        y = Math.max(y - height, 10);
      }

      style.value = {
        left: `${x}px`,
        top: `${y}px`
      };
    });

    return () => h('div', {
      class: 'context_menu',
      style: style.value,
      ref: menu
    }, slots);
  }
};
</script>

<style>
.context_menu {
  position: relative;
  width: 250px;
  padding: 5px 0;
  background: var(--background-accent);
  border-radius: 6px;
  box-shadow: 0 0 4px rgba(0, 0, 0, .2),
              0 4px 36px -6px rgba(0, 0, 0, .4);
}
</style>
