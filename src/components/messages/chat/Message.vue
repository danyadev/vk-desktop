<template>
  <div :class="['message_wrap', ...attachClasses, { showUserData, isUnread, out: msg.out, isLoading: msg.isLoading }]"
       :id="msg.id"
  >
    <div v-if="showUserData" class="message_name">
      {{ name }}
      <div v-if="user && user.verified" class="verified"></div>
    </div>

    <div class="message">
      <img v-if="showUserData" class="message_photo" :src="photo" loading="lazy" width="35" height="35">
      <div v-else-if="isChat && !msg.out && !isChannel" class="message_photo"></div>

      <div class="message_bubble_wrap">
        <SendMsgErrorMenu v-if="msg.isLoading" :msg="msg" />

        <div class="message_bubble">
          <Reply v-if="msg.isReplyMsg" :peer_id="peer_id" :msg="msg" />

          <div v-if="msg.isContentDeleted" class="message_text isContentDeleted">{{ l('im_content_deleted') }}</div>
          <div v-else class="message_text" v-emoji.push.br="msg.text"></div>

          <Attachments :msg="msg" :peer_id="peer_id" />
          <Forwarded v-if="msg.fwdCount" :peer_id="peer_id" :msg="msg" :fwdDepth="1" />

          <div class="message_time_wrap">
            <template v-if="msg.editTime">
              <div class="message_edited">{{ l('im_msg_edited') }}</div>
              <div class="dot"></div>
            </template>

            <div class="message_time">{{ time }}</div>
          </div>
        </div>

        <Keyboard v-if="msg.keyboard" :peer_id="peer_id" :keyboard="msg.keyboard" />
      </div>
    </div>
  </div>
</template>

<script>
  import { getTime } from 'js/date';
  import { getPhoto } from 'js/utils';

  import Attachments from './attachments/Attachments.vue';
  import Reply from './attachments/Reply.vue';
  import Forwarded from './attachments/Forwarded.vue';
  import Keyboard from './Keyboard.vue';
  import SendMsgErrorMenu from './SendMsgErrorMenu.vue';

  export default {    
    props: ['msg', 'peer', 'peer_id', 'messageDate', 'isStartUnread', 'prevMsg'],

    components: {
      Attachments,
      Reply,
      Forwarded,
      Keyboard,
      SendMsgErrorMenu
    },

    computed: {
      user() {
        return this.$store.state.profiles[this.msg.from];
      },
      photo() {
        return getPhoto(this.user) || 'assets/blank.gif';
      },
      isChat() {
        return this.peer_id > 2e9;
      },
      isChannel() {
        return this.peer && this.peer.channel;
      },
      name() {
        return this.user ? this.user.name || `${this.user.first_name} ${this.user.last_name}` : '...';
      },
      time() {
        return getTime(new Date(this.msg.date * 1000));
      },
      isUnread() {
        return this.peer && (
          this.msg.id > this.peer.out_read || // непрочитано собеседником
          this.msg.id > this.peer.in_read // непрочитано мной
        ) || this.msg.isLoading;
      },
      showUserData() {
        return !this.msg.out && this.isChat && !this.isChannel && (
          !this.prevMsg ||
          this.prevMsg.from != this.msg.from ||
          this.prevMsg.action ||
          this.isStartUnread ||
          this.messageDate
        );
      },
      attachClasses() {
        const classes = [];
        const { text, attachments, isReplyMsg, fwdCount } = this.msg;
        const { photo, video, doc, sticker } = attachments;
        const attachNames = Object.keys(attachments);
        const lastAttach = attachNames[attachNames.length-1];
        const onlyPhotoAttachs = (photo || video || doc) && (!doc || doc.every((doc) => doc.preview)) &&
              attachNames.every((attach) => ['photo', 'video', 'doc'].includes(attach));
        const onlyPhotos = onlyPhotoAttachs && !isReplyMsg && !fwdCount;
        const hasPhoto = attachNames.find((attach) => ['photo', 'video'].includes(attach)) ||
              doc && doc.find((doc) => doc.preview);
        let flyTime = false;

        if(attachNames.length || fwdCount) classes.push('hasAttachment');
        if(hasPhoto) classes.push('hasPhoto');
        if(sticker) classes.push('isSticker');
        if(sticker || onlyPhotos) flyTime = true;

        if(onlyPhotos && !text) {
          // Уменьшаем отступы со всех сторон
          classes.push('removeMargin');
          flyTime = true;
        } else if(!text && !isReplyMsg && hasPhoto) {
          // Уменьшаем отступы сверху, справа и слева
          classes.push('removeTopMargin');
        } else if(onlyPhotoAttachs && !fwdCount) {
          // Уменьшаем отступы слева, снизу и справа
          classes.push('removeBottomMargin');
          flyTime = true;
        }

        if(
          sticker && !isReplyMsg ||
          !text && onlyPhotos && attachNames.length == 1 &&
          (photo && photo.length == 1 || video && video.length == 1 || doc && doc.length == 1)
        ) {
          classes.push('hideBubble');
          flyTime = true;
        }

        if(flyTime) classes.push('flyTime');

        return classes;
      }
    }
  }
</script>

<style>
  .message_wrap {
    padding: 8px 14px 4px 14px;
    background-color: #fff;
    transition: background-color 1s;
  }

  .message_wrap[active] {
    background-color: #ebf1f5;
  }

  .message_wrap[active].out {
    background-color: #e9f3ff;
  }

  .message_wrap:not(.showUserData) {
    padding: 4px 14px;
  }

  .message_name {
    color: #254f79;
    font-weight: 500;
    margin-left: 50px;
    margin-bottom: 2px;
  }

  .message_name .verified {
    margin-top: -1px;
  }

  .message {
    display: flex;
  }

  .message_wrap.out .message {
    justify-content: flex-end;
  }

  .message_photo {
    border-radius: 50%;
    width: 35px;
    height: 35px;
    margin-right: 10px;
  }

  .message_bubble_wrap {
    position: relative;
    max-width: 75%;
    display: flex;
    flex-direction: column;
  }

  .modal[name=messages-viewer] .message_bubble_wrap {
    max-width: 100%;
  }

  .message_wrap:not(.hideBubble) .message_bubble {
    background-color: #dfe6ea;
    padding: 8px 12px;
    border-radius: 18px;
    word-break: break-word;
  }

  .message_wrap:not(.hideBubble).out .message_bubble {
    background-color: #c7dff9;
  }

  .message_text {
    display: inline;
  }

  .message_wrap.hasAttachment .message_text:not(:empty) {
    display: block;
  }

  .message_text.isContentDeleted {
    color: #696969;
  }

  .message_time_wrap {
    position: relative;
    display: flex;
    float: right;
    color: #696969;
    font-weight: 500;
    font-size: 11px;
    user-select: none;
    pointer-events: none;
  }

  .message_wrap:not(.hideBubble) .message_time_wrap {
    bottom: -4px;
    margin: 5px 0 0 6px;
  }

  .message_wrap.flyTime .message_time_wrap {
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: #ffffffdf;
    border-radius: 9px;
    padding: 2px 6px;
    width: fit-content;
  }

  .message_wrap.isSticker:not(.hideBubble) .message_time_wrap,
  .message_wrap.flyTime.hideBubble:not(.isSticker) .message_time_wrap {
    right: 4px;
    bottom: 4px;
  }

  .message_wrap.isSticker:not(.hideBubble).out .message_time_wrap {
    background-color: #c7dff9df;
  }

  .message_wrap.isSticker:not(.hideBubble):not(.out) .message_time_wrap {
    background-color: #dfe6eadf;
  }

  .message_edited {
    margin-top: -1px;
  }

  .dot {
    width: 2px;
    height: 2px;
    margin: 6px 3px 0 3px;
    border-radius: 50%;
    background-color: #696969;
  }

  .message_wrap.isUnread .message_bubble::before,
  .message_wrap.isUnread .message_bubble::after {
    position: absolute;
    width: 8px;
    height: 8px;
    bottom: 12px;
    border-radius: 50%;
    background-color: #93adc8;
  }

  .message_wrap:not(.isLoading).isUnread.out .message_bubble::before {
    content: '';
    left: -16px;
  }

  .message_wrap.isUnread:not(.out) .message_bubble::after {
    content: '';
    right: -16px;
  }

  /* Фотографии */

  .message_wrap.flyTime:not(.isSticker) .message_time_wrap {
    background: #00000094;
    color: #f5f5f5;
    right: 10px;
    bottom: 10px;
  }

  .message_wrap.flyTime:not(.isSticker) .dot {
    background: #f5f5f5;
  }

  .message_wrap.hasAttachment .message_text:not(:empty) {
    margin-bottom: 5px;
  }

  .message_wrap.hasPhoto .message_text:not(:empty) {
    margin: 0 5px 5px 5px;
  }

  .message_wrap.removeMargin .attach_photos > .attach_photo_wrap:first-child img,
  .message_wrap.removeTopMargin .attach_photos > .attach_photo_wrap:first-child img {
    border-top-left-radius: 14px;
  }

  .message_wrap.removeMargin .attach_photo_wrap.endFirstRow img,
  .message_wrap.removeTopMargin .attach_photo_wrap.endFirstRow img {
    border-top-right-radius: 14px;
  }

  .message_wrap.removeMargin .attach_photo_wrap.lastRow:first-child img,
  .message_wrap.removeMargin br + .attach_photo_wrap.lastRow img,
  .message_wrap.removeBottomMargin .attach_photo_wrap.lastRow:first-child img {
    border-bottom-left-radius: 14px;
  }

  .message_wrap.removeMargin .attach_photo_wrap.lastRow.lastColumn img,
  .message_wrap.removeBottomMargin .attach_photo_wrap.lastRow.lastColumn img {
    border-bottom-right-radius: 14px;
  }

  .message_wrap.removeMargin:not(.hideBubble) .message_bubble {
    padding: 6px;
  }

  .message_wrap.removeTopMargin .message_bubble {
    padding: 6px 6px 8px 6px;
  }

  .message_wrap.removeBottomMargin .message_bubble {
    padding: 8px 6px 6px 6px;
  }

  .message_wrap.removeOnlyBottomMargin .message_bubble {
    padding-bottom: 6px;
  }

  .message_wrap.removeTopMargin:not(.flyTime) .message_time_wrap,
  .message_wrap.removeBottomMargin:not(.flyTime) .message_time_wrap {
    margin-right: 6px;
  }
</style>
