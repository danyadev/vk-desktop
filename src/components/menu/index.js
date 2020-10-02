import { reactive, computed } from 'vue';
import { getPhoto } from 'js/utils';
import store from 'js/store';
import router from 'js/router';

export const state = reactive({
  activeUserID: computed(() => store.state.users.activeUserID),
  userPhoto: computed(() => getPhoto(store.getters['users/user'])),
  counters: computed(() => store.state.menuCounters),
  route: computed(() => router.currentRoute.value),

  routes: computed(() => (
    ['messages', 'audios'].map((route) => ({
      route,
      active: isActiveRoute(`/${route}`)
    }))
  ))
});

function getBaseRoutes(route) {
  return [
    state.route.path.split('/')[1],
    route.split('/')[1]
  ];
}

function isActiveRoute(route) {
  const [oldBaseRoute, newBaseRoute] = getBaseRoutes(route);
  return oldBaseRoute === newBaseRoute;
}

const lastRoutes = {};

export function openPage(route) {
  const [oldBaseRoute, newBaseRoute] = getBaseRoutes(route);

  if (oldBaseRoute !== newBaseRoute) {
    lastRoutes[oldBaseRoute] = state.route.path;

    router.replace(lastRoutes[newBaseRoute] || route);
  }
}
