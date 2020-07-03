import { reactive, computed } from 'vue';
import store from 'js/store';
import router from 'js/router';

function isActiveRoute(route) {
  return new RegExp(`${route}($|/)`).test(router.currentRoute.value.path);
}

export function openPage(route) {
  if (!isActiveRoute(route)) {
    router.replace(route);
  }
}

export const state = reactive({
  counters: computed(() => store.state.menuCounters),

  routes: computed(() => (
    ['messages', 'audios'].map((route) => ({
      route,
      active: isActiveRoute(`/${route}`)
    }))
  ))
});
