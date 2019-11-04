<template>
  <div v-if="msg.isReplyMsg" class="attach_reply" @click="jump">
    <img v-if="reply.photo" class="attach_reply_photo" :src="reply.photo">

    <div class="attach_reply_content">
      <div class="attach_reply_name">{{ reply.name || '...' }}</div>

      <div v-if="reply.isContentDeleted" class="attach_reply_text isContentDeleted">{{ l('im_content_deleted') }}</div>
      <div v-else :class="['attach_reply_text', { isAttachment: reply.isAttachment }]" v-emoji.push="reply.text || '...'"></div>
    </div>
  </div>
</template>

<script>
  import { parseMessage } from 'js/messages';
  import { getPhotoFromSizes, eventBus } from 'js/utils';

  export default {
    props: ['msg', 'peer_id'],
    methods: {
      getPhoto(msg) {
        let url;

        const photo = msg.attachments.find((attach) => attach.type == 'photo');
        const sticker = msg.attachments.find((attach) => attach.type == 'sticker');

        if(photo) url = getPhotoFromSizes(photo.photo.sizes, 'o').url;
        if(sticker) url = sticker.sticker.images[1].url;

        return url;
      },
      getText(msg) {
        if(msg.text) return msg.text;

        const { isReplyMsg, fwdCount, attachments } = msg;
        const [attach] = attachments;

        if(isReplyMsg) return this.l('im_replied');
        else if(fwdCount) return this.l('im_forwarded', [fwdCount], fwdCount);
        else if(attach) return this.l('im_attachments', attach.type);
      },
      jump() {
        const { replyMsg, id } = this.msg;

        if(replyMsg) {
          eventBus.emit('messages:jumpTo', {
            peer_id: this.peer_id,
            msg_id: replyMsg.id,
            reply_author: id
          });
        }
      }
    },
    computed: {
      reply() {
        if(!this.msg.replyMsg) return {};

        const msg = parseMessage(this.msg.replyMsg);
        const user = this.$store.state.profiles[msg.from];
        const text = this.getText(msg);

        return {
          photo: this.getPhoto(msg),
          name: user && (user.name || `${user.first_name} ${user.last_name}`),
          text: text,
          isContentDeleted: msg.isContentDeleted,
          isAttachment: !msg.text && msg.hasAttachment
        }
      }
    }
  }
</script>

<style scoped>
  .attach_reply {
    display: flex;
    position: relative;
    height: 40px;
    margin-bottom: 4px;
    cursor: pointer;
  }

  .message_wrap:not(.hideBubble).isSticker .attach_reply {
    width: 128px;
  }

  .attach_reply::before {
    content: '';
    position: absolute;
    top: 3px;
    bottom: 0;
    left: 0;
    width: 2px;
    border-radius: 1px;
    background-color: #5281b9;
    transition: background-color .2s;
  }

  .attach_reply_photo {
    flex: none;
    width: 37px;
    height: 37px;
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
