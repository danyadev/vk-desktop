import { reactive, computed } from 'vue';
import { getPhoto } from 'js/utils';
import store from 'js/store';
import router from 'js/router';

export const state = reactive({
  activeUserID: computed(() => store.state.users.activeUserID),
  userPhoto: computed(() => getPhoto(store.getters['users/user'])),
  counters: computed(() => store.state.menuCounters),

  routes: computed(() => (
    ['messages', 'audios'].map((route) => ({
      route,
      active: isActiveRoute(`/${route}`)
    }))
  ))
});

function isActiveRoute(route) {
  return new RegExp(`${route}($|/)`).test(router.currentRoute.value.path);
}

export function openPage(route) {
  if (!isActiveRoute(route)) {
    router.replace(route);
  }
}
