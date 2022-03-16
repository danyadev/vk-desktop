<template>
  <Transition name="fade-out">
    <div v-if="text" class="tooltip">
      <div class="tooltip_arrow" :style="arrowPosition"></div>
      <div ref="tooltip" class="tooltip_text" :style="textPosition">{{ text }}</div>
    </div>
  </Transition>
</template>

<script>
import { reactive, nextTick } from 'vue';
import getTranslate from 'js/getTranslate';

export default {
  setup() {
    const state = reactive({
      tooltip: null,
      text: '',
      arrowPosition: {},
      textPosition: {}
    });

    function setPosition(el) {
      const [titlebar, app] = document.querySelector('.root').children;
      const { clientWidth } = app;
      const { width: tooltipWidth } = state.tooltip.getBoundingClientRect();
      let { x, y, width, height } = el.getBoundingClientRect();

      const centerElX = x + width / 2;
      const maxTooltipRight = clientWidth - tooltipWidth - 8;

      // Вычитаем из координаты высоту тайтлбара, т.к. враппер контекстного меню имеет высоту в виде
      // <высота приложения> - <высота тайтлбара>, а координаты приходят с верхней точки приложения
      y -= titlebar.clientHeight - height;
      // Центруем тултип по центру элемента
      x = centerElX - tooltipWidth / 2;

      if (x > maxTooltipRight) {
        x = maxTooltipRight;
      }

      state.textPosition = {
        left: x + 'px',
        top: y + 'px'
      };

      state.arrowPosition = {
        left: centerElX - 5 + 'px',
        top: y - 2 + 'px'
      };
    }

    let prevEl;

    window.addEventListener('mousemove', async (event) => {
      const el = event.path.find((el) => el.dataset && el.dataset.tooltip);

      if (el && prevEl !== el) {
        state.text = getTranslate(el.dataset.tooltip);
        await nextTick();
        setPosition(el);
      } else if (!el && prevEl) {
        state.text = '';
      }

      prevEl = el;
    });

    return state;
  }
};
</script>

<style>
.tooltip {
  z-index: 3;
}

.tooltip_text {
  position: absolute;
  margin-top: 8px;
  background: rgba(0, 0, 0, .7);
  border-radius: 3px;
  font-size: 12.5px;
  color: #fff;
  pointer-events: none;
  white-space: nowrap;
  padding: 5px 8px;
}

.tooltip_arrow {
  position: absolute;
  border: 5px solid transparent;
  border-bottom: 5px solid rgba(0, 0, 0, .7);
}
</style>
