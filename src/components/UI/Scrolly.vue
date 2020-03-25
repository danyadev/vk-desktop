<template>
  <div
    ref="scrolly"
    :class="['scrolly', { isActive, isScrolling }]"
    tabindex="-1"
    @wheel.passive="onWheel"
    @keydown="onKeyDown"
    @touchstart="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="hideScrollBars"
  >
    <div ref="viewport" :class="['scrolly-viewport', vclass]"><slot /></div>

    <div
      class="scrolly-bar-wrap axis-x"
      @mouseenter="activateScrollBars({ enter: 1 })"
      @mouseleave="hideScrollBars"
      @mousedown="onMouseDown"
    >
      <div ref="barX" class="scrolly-bar"></div>
    </div>

    <div
      class="scrolly-bar-wrap axis-y"
      @mouseenter="activateScrollBars({ enter: 1 })"
      @mouseleave="hideScrollBars"
      @mousedown="onMouseDown"
    >
      <div ref="barY" class="scrolly-bar"></div>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs, onMounted, onBeforeUnmount } from 'vue';
import { debounce } from 'js/utils';

const waitAnimationFrame = () => new Promise(requestAnimationFrame);

function normalize(num, max) {
  return Math.max(0, Math.min(num, max));
}

function toPercent(n) {
  return `${normalize(n, 1) * 100}%`;
}

export default {
  props: ['vclass', 'lock', 'horizontalScroll', 'mutationWhitelist'],

  setup(props, { emit }) {
    const state = reactive({
      scrolly: null,
      viewport: null,
      barX: null,
      barY: null,

      touchX: 0,
      touchY: 0,

      isActive: false,
      isScrolling: false,

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

    function onWheel(event) {
      let { deltaX, deltaY } = event;

      if (event.altKey || props.horizontalScroll) {
        deltaX = deltaY > 0 ? 100 : -100;
        deltaY = 0;
      }

      const isEndScroll = refreshScrollLayout(deltaX, deltaY) === false;

      if (!props.lock && (!isEndScroll || isEndScroll && props.horizontalScroll)) {
        event.stopPropagation();
        activateScrollBars();
      }
    }

    function onKeyDown(event) {
      const { clientHeight } = state.scrolly;
      const position = {
        33: [0, 10 - clientHeight], // Page Up
        34: [0, clientHeight - 10], // Page Down
        37: [-20, 0], // Left Arrow
        38: [0, -20], // Up Arrow
        39: [20, 0], // Right Arrow
        40: [0, 20] // Down Arrow
      }[event.which];

      if (position) {
        if (event.which === 33 || event.which === 34) {
          event.preventDefault();
        }

        activateScrollBars();
        refreshScrollLayout(...position);
      }
    }

    function onTouchStart({ touches: [touch] }) {
      state.touchX = touch.pageX;
      state.touchY = touch.pageY;

      activateScrollBars({ enter: 1 });
    }

    async function onTouchMove({ touches: [touch] }) {
      await waitAnimationFrame();

      const dx = state.touchX - touch.pageX;
      const dy = state.touchY - touch.pageY;

      state.touchX = touch.pageX;
      state.touchY = touch.pageY;

      refreshScrollLayout(dx, dy);
    }

    function onMouseDown({ target: clickTarget, pageX: initialPageX, pageY: initialPageY }) {
      const { viewport } = state;
      const bar = clickTarget.matches('.scrolly-bar') ? clickTarget : clickTarget.firstChild;
      const initialBarTop = bar.offsetTop;
      const initialBarLeft = bar.offsetLeft;

      async function onMouseMove({ target, pageX, pageY, offsetX, offsetY }, isMouseUp) {
        if (props.lock) return;

        const isMoveToPoint = isMouseUp && target.matches('.scrolly-bar-wrap');
        const { scrollWidth, offsetWidth, scrollHeight, offsetHeight } = viewport;
        let dx = 0;
        let dy = 0;

        await waitAnimationFrame();

        if (bar.parentElement.matches('.axis-x')) {
          const maxBarLeft = offsetWidth - bar.offsetWidth;
          const barLeft = normalize(
            isMoveToPoint
              ? offsetX - bar.offsetWidth / 2
              : initialBarLeft + pageX - initialPageX,
            maxBarLeft
          );
          const scrollLeft = (barLeft / maxBarLeft) * (scrollWidth - offsetWidth);

          dx = scrollLeft - viewport.scrollLeft;
          viewport.scrollLeft = scrollLeft;
          bar.style.left = toPercent(barLeft / offsetWidth);
        } else {
          const maxBarTop = offsetHeight - bar.offsetHeight;
          const barTop = normalize(
            isMoveToPoint
              ? offsetY - bar.offsetHeight / 2
              : initialBarTop + pageY - initialPageY,
            maxBarTop
          );
          const scrollTop = (barTop / maxBarTop) * (scrollHeight - offsetHeight);

          dy = scrollTop - viewport.scrollTop;
          viewport.scrollTop = scrollTop;
          bar.style.top = toPercent(barTop / offsetHeight);
        }

        emit('scroll', { viewport, dx, dy });
      }

      function onMouseUp(event) {
        state.isScrolling = false;

        if (initialPageX === event.pageX && initialPageY === event.pageY) {
          onMouseMove(event, true);
        } else if (event.target !== clickTarget) {
          activateScrollBars({ force: 1 });
        }

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      state.isScrolling = true;
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
      if (!state.isScrolling) {
        state.isActive = false;
      }
    });

    function refreshScrollLayout(dx = 0, dy = 0) {
      const { viewport, barX, barY } = state;
      if (!viewport) return;

      if (!props.lock) {
        const {
          scrollLeft: prevScrollLeft,
          scrollTop: prevScrollTop
        } = viewport;

        viewport.scrollLeft += dx;
        viewport.scrollTop += dy;

        const noX = dx && prevScrollLeft === viewport.scrollLeft;
        const noY = dy && prevScrollTop === viewport.scrollTop;

        // Здесь не нужна проверка на !dx && !dy, потому что
        // такой кейс появляется только когда метод вызван вручную
        if ((noX && noY) || (noX && !dy) || (noY && !dx)) return false;
      }

      const {
        scrollLeft, scrollWidth, offsetWidth,
        scrollTop, scrollHeight, offsetHeight
      } = viewport;

      const width = toPercent(offsetWidth / scrollWidth);
      const height = toPercent(offsetHeight / scrollHeight);

      barX.style.width = width;
      barY.style.height = height;

      barX.parentElement.style.display = (width === '100%') ? 'none' : 'block';
      barY.parentElement.style.display = (height === '100%') ? 'none' : 'block';

      const barLeft = scrollLeft / (scrollWidth - offsetWidth) * (offsetWidth - barX.offsetWidth);
      const barTop = scrollTop / (scrollHeight - offsetHeight) * (offsetHeight - barY.offsetHeight);

      barX.style.left = toPercent(barLeft / offsetWidth);
      barY.style.top = toPercent(barTop / offsetHeight);

      if (dx || dy) {
        emit('scroll', { viewport, dx, dy });
      }
    }

    onMounted(() => {
      state.mutationObserver = new MutationObserver((records) => {
        const whitelist = props.mutationWhitelist;

        const isWhitelistedMutate = records.find(({ target }) => {
          if (whitelist) {
            return whitelist.find((selector) => target.matches && target.matches(selector));
          } else {
            return !target.matches || !target.matches('.ripples');
          }
        });

        if (isWhitelistedMutate) {
          refreshScrollLayout();
        }
      });

      state.mutationObserver.observe(state.viewport, {
        childList: true,
        characterData: true,
        subtree: true
      });

      state.resizeObserver = new ResizeObserver(
        debounce(() => refreshScrollLayout(), 250)
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

      onWheel,
      onKeyDown,
      onTouchStart,
      onTouchMove,
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

.scrolly.isScrolling {
  -webkit-user-drag: none;
}

.scrolly-viewport {
  overflow: hidden;
  height: 100%;
}

.scrolly-bar-wrap {
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
  position: absolute;
  border: 4px solid transparent;
  cursor: pointer;
  opacity: 0;
  transition: opacity .3s;
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
.scrolly.isScrolling > .scrolly-bar-wrap .scrolly-bar::before {
  background: rgba(0, 0, 0, .4);
}

.scrolly-bar-wrap.axis-x .scrolly-bar {
  bottom: 0;
  height: 7px;
  min-width: 20%;
}

.scrolly-bar-wrap.axis-y .scrolly-bar {
  right: 0;
  width: 7px;
  min-height: 20%;
}
</style>
