<template>
  <div
    ref="scrolly"
    :class="['scrolly', { isActive, isManualScrolling }]"
    tabindex="-1"
  >
    <div
      ref="viewport"
      :class="['scrolly-viewport', vclass, lock && 'lock']"
      @scroll.passive.stop="onScroll"
    >
      <slot />
    </div>

    <div
      class="scrolly-bar-wrap axis-x"
      @mouseenter="activateScrollBars({ enter: 1 })"
      @mouseleave="hideScrollBars"
      @mousedown="onMouseDown"
      @wheel.passive="onBarWheel"
    >
      <div ref="barX" class="scrolly-bar"></div>
    </div>

    <div
      class="scrolly-bar-wrap axis-y"
      @mouseenter="activateScrollBars({ enter: 1 })"
      @mouseleave="hideScrollBars"
      @mousedown="onMouseDown"
      @wheel.passive="onBarWheel"
    >
      <div ref="barY" class="scrolly-bar"></div>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs, onMounted, onBeforeUnmount } from 'vue';
import { debounce } from 'js/utils';
import store from 'js/store';

function normalize(num, max) {
  return Math.max(0, Math.min(num, max));
}

function toPercent(n) {
  return `${normalize(n, 1) * 100}%`;
}

export default {
  props: ['vclass', 'lock'],
  emits: ['scroll'],

  setup(props, { emit }) {
    const state = reactive({
      scrolly: null,
      viewport: null,
      barX: null,
      barY: null,

      // Используется в MutationObserver
      actualScrollWidth: 0,
      actualScrollHeight: 0,

      // Используется для вычисления dx и dy в refreshScrollLayout
      lastScrollTop: 0,
      lastScrollLeft: 0,

      barOffsetTop: 0,
      barOffsetLeft: 0,

      barXDisplay: 'none',
      barYDisplay: 'none',

      isActive: false,
      isManualScrolling: false,

      mutationObserver: null,
      resizeObserver: null,

      timerId: null
    });

    function modifiedDebounce(fn) {
      return function(...args) {
        if (state.timerId) {
          clearTimeout(state.timerId);
        }

        state.timerId = setTimeout(() => {
          fn.apply(this, args);
          state.timerId = null;
        }, 500);
      };
    }

    function clearTimer() {
      clearTimeout(state.timerId);
      state.timerId = null;
    }

    function onScroll() {
      refreshScrollLayout();

      if (!store.state.lockNextScrollyRender) {
        activateScrollBars();
      } else {
        store.state.lockNextScrollyRender = false;
      }
    }

    function onBarWheel(event) {
      requestAnimationFrame(() => {
        event.deltaX && (state.viewport.scrollLeft += event.deltaX);
        event.deltaY && (state.viewport.scrollTop += event.deltaY);
      });
    }

    function onMouseDown({ target: clickTarget, pageX: initialPageX, pageY: initialPageY }) {
      const { viewport } = state;
      const bar = clickTarget.matches('.scrolly-bar') ? clickTarget : clickTarget.firstChild;
      const initialBarTop = state.barOffsetTop;
      const initialBarLeft = state.barOffsetLeft;

      function onMouseMove({ target, pageX, pageY, offsetX, offsetY }, isMouseUp) {
        if (props.lock) {
          return;
        }

        const isMoveToPoint = isMouseUp && target.matches('.scrolly-bar-wrap');
        const { scrollWidth, offsetWidth, scrollHeight, offsetHeight } = viewport;

        const prevScrollLeft = viewport.scrollLeft;
        const prevScrollTop = viewport.scrollTop;
        let dx = 0;
        let dy = 0;

        if (bar.parentElement.matches('.axis-x')) {
          const maxBarLeft = offsetWidth - bar.offsetWidth;
          const barLeft = normalize(
            maxBarLeft,
            isMoveToPoint
              ? offsetX - bar.offsetWidth / 2
              : initialBarLeft + pageX - initialPageX
          );
          const scrollLeft = (barLeft / maxBarLeft) * (scrollWidth - offsetWidth);

          dx = scrollLeft - prevScrollLeft;

          requestAnimationFrame(() => {
            if (isMoveToPoint) {
              viewport.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
              });
            } else {
              viewport.scrollLeft = scrollLeft;

              bar.style.transform = `translateX(${barLeft}px)`;
              state.barOffsetLeft = barLeft;
            }
          });
        } else {
          const maxBarTop = offsetHeight - bar.offsetHeight;
          const barTop = normalize(
            maxBarTop,
            isMoveToPoint
              ? offsetY - bar.offsetHeight / 2
              : initialBarTop + pageY - initialPageY
          );
          const scrollTop = (barTop / maxBarTop) * (scrollHeight - offsetHeight);

          dy = scrollTop - prevScrollTop;

          requestAnimationFrame(() => {
            if (isMoveToPoint) {
              viewport.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
              });
            } else {
              viewport.scrollTop = scrollTop;

              bar.style.transform = `translateY(${barTop}px)`;
              state.barOffsetTop = barTop;
            }
          });
        }

        emit('scroll', { viewport, dx, dy });
      }

      function onMouseUp(event) {
        state.isManualScrolling = false;

        if (initialPageX === event.pageX && initialPageY === event.pageY) {
          onMouseMove(event, true);
        } else if (event.target !== clickTarget) {
          activateScrollBars({ force: 1 });
        }

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      state.isManualScrolling = true;
      state.isActive = true;
      clearTimer();

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    function activateScrollBars({ enter, force } = {}) {
      if (enter) {
        state.isActive = true;
        clearTimer();
      } else if (force || !state.isActive || state.timerId) {
        state.isActive = true;
        hideScrollBars();
      }
    }

    const hideScrollBars = modifiedDebounce(() => {
      if (!state.isManualScrolling) {
        state.isActive = false;
      }
    });

    function refreshScrollLayout(isMutationObserver) {
      const { viewport, barX, barY } = state;

      if (!viewport) {
        return;
      }

      const {
        scrollLeft, scrollWidth, offsetWidth,
        scrollTop, scrollHeight, offsetHeight
      } = viewport;

      // Компонент был скрыт
      if (!scrollWidth && !scrollHeight) {
        return;
      }

      const width = toPercent(offsetWidth / scrollWidth);
      const height = toPercent(offsetHeight / scrollHeight);

      const barXDisplay = (width === '100%') ? 'none' : 'block';
      const barYDisplay = (height === '100%') ? 'none' : 'block';

      if (barXDisplay === 'block') {
        const barLeft = scrollLeft / (scrollWidth - offsetWidth) * (offsetWidth - barX.offsetWidth);

        barX.style.width = width;
        barX.style.transform = `translateX(${barLeft}px)`;

        state.barOffsetLeft = barLeft;
      }

      if (barXDisplay !== state.barXDisplay) {
        barX.parentElement.style.display = barXDisplay;
        state.barXDisplay = barXDisplay;
      }

      if (barYDisplay === 'block') {
        const barTop = (
          scrollTop / (scrollHeight - offsetHeight) * (offsetHeight - barY.offsetHeight)
        );

        barY.style.height = height;
        barY.style.transform = `translateY(${barTop}px)`;

        state.barOffsetTop = barTop;
      }

      if (barYDisplay !== state.barYDisplay) {
        barY.parentElement.style.display = barYDisplay;
        state.barYDisplay = barYDisplay;
      }

      if (!isMutationObserver) {
        emit('scroll', {
          viewport,
          dx: scrollLeft - state.lastScrollLeft,
          dy: scrollTop - state.lastScrollTop
        });
      }

      state.lastScrollLeft = scrollLeft;
      state.lastScrollTop = scrollTop;
    }

    onMounted(() => {
      state.mutationObserver = new MutationObserver(() => {
        if (
          state.actualScrollWidth !== state.viewport.scrollWidth ||
          state.viewport.scrollHeight !== state.actualScrollHeight
        ) {
          state.actualScrollWidth = state.viewport.scrollWidth;
          state.actualScrollHeight = state.viewport.scrollHeight;
          refreshScrollLayout(true);
        }
      });

      state.mutationObserver.observe(state.viewport, {
        childList: true,
        characterData: true,
        subtree: true
      });

      state.resizeObserver = new ResizeObserver(
        debounce(refreshScrollLayout, 250)
      );

      state.resizeObserver.observe(state.viewport, {
        box: 'border-box'
      });
    });

    onBeforeUnmount(() => {
      state.mutationObserver.disconnect();
      state.resizeObserver.disconnect();
    });

    return {
      ...toRefs(state),

      onScroll,
      onBarWheel,
      onMouseDown,
      activateScrollBars,
      hideScrollBars
    };
  }
};
</script>

<style>
.scrolly {
  position: relative;
}

.scrolly.isManualScrolling {
  -webkit-user-drag: none;
}

.scrolly-viewport {
  overflow: auto;
  height: 100%;
}

.scrolly-viewport.lock {
  overflow: hidden;
}

.scrolly-bar-wrap {
  /* переопределяется в JS */
  display: none;
  position: absolute;
  z-index: 1;
}

.scrolly-bar-wrap.axis-x {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 15px;
}

.scrolly-bar-wrap.axis-y {
  top: 0;
  right: 0;
  width: 15px;
  height: 100%;
}

.scrolly-bar {
  box-sizing: content-box;
  border: 4px solid transparent;
  cursor: pointer;
  opacity: 0;
  transition: opacity .3s;
  will-change: transform, opacity;
}

.scrolly.isActive > .scrolly-bar-wrap .scrolly-bar {
  opacity: 1;
}

.scrolly-bar::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, .3);
  border-radius: 7px;
  transition: background-color .3s;
}

.scrolly-bar:hover::before,
.scrolly.isManualScrolling > .scrolly-bar-wrap .scrolly-bar::before {
  background: rgba(0, 0, 0, .4);
}

.scrolly-bar-wrap.axis-x .scrolly-bar {
  height: 7px;
  min-width: 20%;
}

.scrolly-bar-wrap.axis-y .scrolly-bar {
  width: 7px;
  min-height: 20%;
}
</style>
