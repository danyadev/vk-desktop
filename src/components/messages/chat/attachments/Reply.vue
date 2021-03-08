<template>
  <div class="attach_reply attach_left_border" @click="jump">
    <img
      v-if="photo"
      :src="photo"
      class="attach_reply_photo"
      loading="lazy"
      width="37"
      height="37"
    >

    <div class="attach_reply_content">
      <div class="attach_reply_name">{{ name }}</div>

      <div v-if="msg.isContentDeleted" class="attach_reply_text isContentDeleted">
        {{ l(msg.isExpired ? 'is_message_expired' : 'im_attachment_deleted') }}
      </div>
      <div v-else :class="['attach_reply_text', { hasAttachment: msg.hasAttachment && !msg.text }]">
        <VKText preview>{{ text }}</VKText>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import { getPhotoFromSizes, eventBus } from 'js/utils';
import { getMessagePreview, getPeerTitle, parseMessage } from 'js/messages';
import vkapi from 'js/vkapi';
import store from 'js/store';
import router from 'js/router';

import VKText from '../../../UI/VKText.vue';

export default {
  props: ['peer_id', 'msg', 'ownerMsgId'],

  components: {
    VKText
  },

  setup(props) {
    const state = reactive({
      photo: computed(() => {
        const { photo, sticker, doc, video, story, link } = props.msg.attachments;
        const photoDoc = doc && doc.find((doc) => doc.preview);
        const videoImage = video && video[0].image;
        const storyImage = story && story[0] && story[0].photo;
        const linkImage = link && link[0].photo;

        // TODO Убрать, когда все вложения будут грузиться по умолчанию
        if (story && !story[0]) {
          vkapi('messages.getById', {
            message_ids: props.msg.id
          }).then(({ items: [msg] }) => {
            store.commit('messages/editMessage', {
              peer_id: props.peer_id,
              msg: parseMessage(msg)
            });
          });
        }

        if (photo) return getPhotoFromSizes(photo[0].sizes, ['o', 'x']).url;
        if (sticker) return sticker[0].images[devicePixelRatio > 1 ? 1 : 0].url;
        if (photoDoc) return getPhotoFromSizes(photoDoc.preview.photo.sizes, 'o').src;
        if (videoImage) return (videoImage[6] || videoImage[videoImage.length - 1]).url;
        if (storyImage) return getPhotoFromSizes(storyImage.sizes, ['o', 'j', 'm', 'x']).url;
        if (linkImage) return getPhotoFromSizes(linkImage.sizes, ['o', 'x']).url;
      }),

      user: computed(() => store.state.profiles[props.msg.from]),
      name: computed(() => getPeerTitle(0, null, state.user)),
      text: computed(() => getMessagePreview(props.msg))
    });

    async function jump() {
      function openMessagesViewer() {
        store.commit('messages/openMessagesViewer', {
          messages: [props.msg],
          peer_id: props.peer_id
        });
      }

      function jumpToMsg() {
        store.commit('messages/closeMessagesViewer');

        eventBus.emit('messages:event', 'jump', {
          peer_id: props.peer_id,
          msg_id: props.msg.id,
          reply_author: props.ownerMsgId,
          mark: true
        });
      }

      if (!props.msg.id) {
        return openMessagesViewer();
      }

      const messages = store.state.messages.messages[props.peer_id];

      if (messages.find((msg) => msg.id === props.msg.id)) {
        const openedPeerId = router.currentRoute.value.params.id;

        if (openedPeerId !== props.peer_id) {
          await router.push(`/messages/${props.peer_id}`);
        }

        return jumpToMsg();
      }

      // При удалении для всех своих сообщений, id в ответах на сообщения не удаляются,
      // а обьект сообщения приходит, но с deleted = true.
      // Также юзер может удалить сообщение, на которое был произведен ответ,
      // поэтому нужно в любом случае проверить наличие сообщения
      const { items: [msg] } = await vkapi('messages.getById', {
        message_ids: props.msg.id
      });

      if (!msg || msg.deleted) {
        openMessagesViewer();
      } else {
        jumpToMsg();
      }
    }

    return {
      ...toRefs(state),
      jump
    };
  }
};
</script>

<style>
.attach_reply {
  display: flex;
  position: relative;
  height: 40px;
  margin-bottom: 4px;
  cursor: pointer;
  user-select: none;
}

.attach_reply::before {
  top: 3px !important;
}

.message.removeBottomMargin .attach_reply,
.message.removeMiddleMargin .attach_reply {
  margin-left: 5px;
}

.message.hasPhoto .attach_reply {
  margin-bottom: 8px;
}

.message.hasPhoto .attach_reply + .message_text:not(:empty) {
  margin-top: -4px;
}

.attach_reply.attach_left_border::before {
  background: var(--background-blue);
}

.attach_reply_photo {
  flex: none;
  margin: 3px -4px 0 7px;
  border-radius: 4px;
  object-fit: cover;
}

.attach_reply_content,
.attach_reply_name,
.attach_reply_text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.attach_reply_content {
  margin-left: 10px;
}

.attach_reply_name {
  color: var(--text-blue);
  font-weight: 500;
  font-size: 13px;
  margin: 4px 0 2px 0;
}

.attach_reply_text.hasAttachment {
  color: var(--text-blue);
}

.attach_reply_text.isContentDeleted {
  color: var(--text-dark-steel-gray);
}
</style>
