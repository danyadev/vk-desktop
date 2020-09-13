import { reactive, computed } from 'vue';
import { getPhoto } from 'js/utils';
import { openModal } from 'js/modals';
import { usersStorage } from 'js/store/Storage';
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

export function setAccount(id) {
  if (state.activeUserID === id) {
    return;
  }

  if (state.activeUserID) {
    usersStorage.update({
      ...usersStorage.data,
      activeUserID: id
    });

    window.location.reload();
  } else {
    store.commit('users/setActiveUser', id);
  }
}

export function removeAccount(id) {
  if (id === state.activeUserID) {
    openModal('logout');
  } else {
    store.commit('users/removeUser', id);
  }
}
