<template>
  <div class="attach_reply attach_left_border" @click="jump">
    <img v-if="reply.photo" class="attach_reply_photo" :src="reply.photo" loading="lazy" width="37" height="37">

    <div class="attach_reply_content">
      <div class="attach_reply_name">{{ reply.name || '...' }}</div>

      <div v-if="reply.isContentDeleted" class="attach_reply_text isContentDeleted">{{ l('im_attachment_deleted') }}</div>
      <div v-else :class="['attach_reply_text', { isAttachment: reply.isAttachment }]" v-emoji.push="reply.text || '...'"></div>
    </div>
  </div>
</template>

<script>
  import { getPhotoFromSizes, eventBus } from 'js/utils';
  import { getMessagePreview } from 'js/messages';
  import vkapi from 'js/vkapi';

  export default {
    props: ['msg', 'peer_id', 'isFwdMsg'],

    computed: {
      reply() {
        const { replyMsg } = this.msg;
        if(!replyMsg) return {};

        const user = this.$store.state.profiles[replyMsg.from];

        return {
          photo: this.getPhoto(replyMsg),
          name: user && (user.name || `${user.first_name} ${user.last_name}`),
          text: getMessagePreview(replyMsg, this.peer_id),
          isContentDeleted: replyMsg.isContentDeleted,
          isAttachment: !replyMsg.text && replyMsg.hasAttachment
        };
      }
    },

    methods: {
      getPhoto(msg) {
        const { photo, sticker, doc, video, story } = msg.attachments;
        const photoDoc = doc && doc.find((doc) => doc.preview);
        const videoImages = video && video[0].image;
        const storyPhotos = story && story[0].photo;

        if(photo) return getPhotoFromSizes(photo[0].sizes, 'o').url;
        if(sticker) return sticker[0].images[1].url;
        if(photoDoc) return getPhotoFromSizes(photoDoc.preview.photo.sizes, 'm').src;
        if(video) return (videoImages[6] || videoImages[videoImages.length-1]).url;
        if(storyPhotos) return getPhotoFromSizes(storyPhotos.sizes, ['o', 'j', 'm', 'x']).url;
      },

      async jump() {
        const { replyMsg, id } = this.msg;

        if(replyMsg) {
          const openMessageViewer = () => {
            this.$modals.open('messages-viewer', {
              peer_id: this.peer_id,
              messages: [replyMsg]
            });
          }

          const jumpToMsg = () => {
            eventBus.emit('messages:event', 'jump', {
              peer_id: this.peer_id,
              msg_id: replyMsg.id,
              reply_author: id
            });
          }

          if(!replyMsg.id || this.isFwdMsg) {
            openMessageViewer();
          } else {
            const messages = this.$store.state.messages.messages[this.peer_id] || [];

            if(messages.find(({ id }) => id == replyMsg.id)) {
              jumpToMsg();
            } else {
              // При удалении для всех своих сообщений id в ответах на сообщения не удаляются,
              // а обьект сообщения приходит, но с deleted = true.
              // Также юзер может удалить сообщение, на которое был произведен ответ,
              // поэтому нужно в любом случае проверить наличие сообщения
              const { items: [msg] } = await vkapi('messages.getById', {
                message_ids: replyMsg.id
              });

              if(!msg || msg.deleted) openMessageViewer();
              else jumpToMsg();
            }
          }
        }
      }
    }
  }
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
    top: 3px;
  }

  .message_wrap.removeBottomMargin .attach_reply {
    margin-left: 5px;
  }

  .message_wrap.removeMiddleMargin .attach_reply {
    margin-left: 5px;
  }

  .message_wrap.hasPhoto .attach_reply {
    margin-bottom: 8px;
  }

  .message_wrap.hasPhoto .attach_reply + .message_text:not(:empty) {
    margin-top: -4px;
  }

  .attach_reply_photo {
    flex: none;
    margin: 4px -4px 0 7px;
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
    color: #254f79;
    font-weight: 500;
    margin-top: 3px;
  }

  .attach_reply_text {
    margin-top: 1px;
  }

  .attach_reply_text.isAttachment {
    color: #254f79;
  }

  .attach_reply_text.isContentDeleted {
    color: #696969;
  }
</style>
