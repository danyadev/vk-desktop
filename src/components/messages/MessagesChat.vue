<template>
  <div class="im_chat_container">
    <Header :peer_id="peer_id" :peer="peer" @close="$router.back()" />
    <div :class="['im_chat_wrap', { disablePhotoSticking }]">
      <List :peer_id="peer_id" :peer="peer" />
      <Input :peer_id="peer_id" :peer="peer" />
    </div>

    <Transition name="fade-out">
      <MessagesChatViewer
        v-if="viewer.messages.length"
        :peer_id="viewer.peer_id"
        :messages="viewer.messages"
      />
    </Transition>
  </div>
</template>

<script>
import { reactive, computed, watch, nextTick, onMounted, onActivated } from 'vue';
import { loadConversation } from 'js/api/messages';
import store from 'js/store';
import router from 'js/router';
import { modalsState } from 'js/modals';

import MessagesChatViewer from './MessagesChatViewer.vue';
import Header from './chat/Header.vue';
import List from './chat/List.vue';
import Input from './chat/Input.vue';

export default {
  components: {
    MessagesChatViewer,
    Header,
    List,
    Input
  },

  setup() {
    const state = reactive({
      // Здесь не нужен computed, потому что MessagesChat создается отдельно для каждой беседы
      // и сохраняется с помощью KeepAlive
      peer_id: +router.currentRoute.value.params.id,
      viewer: computed(() => store.state.messages.viewer),

      peer: computed(() => {
        const conversation = store.state.messages.conversations[state.peer_id];
        return conversation && conversation.peer;
      }),

      pinnedMsg: computed(() => {
        if (state.peer && state.peer.pinnedMsg) {
          return !store.getters['settings/settings'].hiddenPinnedMessages[state.peer_id];
        }
      }),

      disablePhotoSticking: computed(() => (
        state.viewer.messages.length || modalsState.hasModals
      ))
    });

    let photoEl;

    // Если во время отключения прилипания одна из аватарок была уже "летающей", мы
    // подменяем прилипание на вычисленное значение top, чтобы визуально ничего не поменялось
    watch(() => state.disablePhotoSticking, async (value) => {
      if (value) {
        const slice = (val) => [].slice.call(val);
        let top;

        let photosBefore = slice(document.querySelectorAll('.message_photo'))
          .map((el) => ({ el, offsetTop: el.offsetTop }))
          .reverse();
        await nextTick();
        let photosAfter = slice(document.querySelectorAll('.message_photo')).reverse();

        photosBefore = photosBefore.filter(({ el }) => photosAfter.includes(el));
        photosAfter = photosAfter.filter((aEl) => photosBefore.find(({ el }) => el === aEl));

        for (const i in photosBefore) {
          if (photosBefore[i].offsetTop > photosAfter[i].offsetTop) {
            photoEl = photosAfter[i];
            top = photosBefore[i].offsetTop - photosAfter[i].offsetTop;
            break;
          }
        }

        if (photoEl) {
          photoEl.style.position = 'relative';
          photoEl.style.top = top + 'px';
        }
      } else if (photoEl) {
        photoEl.style.position = '';
        photoEl.style.top = '';
        photoEl = null;
      }
    }, { flush: 'pre' });

    onMounted(() => {
      store.commit('messages/updatePeerConfig', {
        peer_id: state.peer_id,
        wasOpened: true
      });
    });

    onActivated(() => {
      if (!state.peer || !state.peer.loaded || state.peer_id < 2e9) {
        loadConversation(state.peer_id);
      }
    });

    return state;
  }
};
</script>

<style>
.im_chat_container {
  display: flex;
  flex-direction: column;
  position: relative;
}

.im_chat_wrap {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: auto;
}

.im_chat_wrap.disablePhotoSticking .message_photo {
  /* Наложение блока (модалка; просмотрщик фотографий) на элемент с position: sticky */
  /* выносит этот блок на новый слой, что делает невозможным поддержку */
  /* субпиксельного антиалиасинга текста */
  position: unset;
}
</style>
