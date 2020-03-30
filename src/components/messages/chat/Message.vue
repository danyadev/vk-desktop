<template>
  сообщение {{ msg.id }}
</template>

<script>
import { reactive, computed } from 'vue';
import { getTime } from 'js/date';
import { getPhoto } from 'js/utils';
import { getPeerTitle } from 'js/messages';
import store from 'js/store';

export default {
  props: ['peer_id', 'peer', 'msg', 'prevMsg', 'messageDate'],

  setup(props) {
    const state = reactive({
      user: computed(() => store.state.profiles[props.msg.from]),
      photo: computed(() => getPhoto(state.user) || 'assets/blank.gif'),
      name: computed(() => getPeerTitle(0, 0, state.user)),
      isChat: computed(() => props.peer_id > 2e9),
      isChannel: computed(() => props.peer && props.peer.channel),
      time: computed(() => getTime(new Date(props.msg.date * 1000))),

      isUnread: computed(() => {
        return props.peer && (
          props.msg.id > props.peer.out_read || // непрочитано собеседником
          props.msg.id > props.peer.in_read // непрочитано мной
        ) || props.msg.isLoading;
      })
    });

    return state;
  }
};
</script>
