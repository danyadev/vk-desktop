<template>
  <div :class="['message_wrap', ...attachClasses, { showUserData, isUnread, out: msg.out, isLoading: msg.isLoading }]" :id="msg.id">
    <div v-if="showUserData" class="message_name">
      {{ name }}
      <div v-if="user && user.verified" class="verified"></div>
    </div>

    <div class="message">
      <img v-if="showUserData" class="message_photo" :src="photo">
      <div v-else-if="isChat && !msg.out && !isChannel" class="message_photo"></div>

      <div class="message_bubble_wrap">
        <div class="message_bubble">
          <Reply v-if="msg.isReplyMsg" :msg="msg" :peer_id="peer_id" />

          <div v-if="msg.isContentDeleted" class="message_text isContentDeleted">{{ l('im_content_deleted') }}</div>
          <div v-else class="message_text" v-emoji.push.br="msg.text"></div>

          <Attachments :msg="msg" :peer_id="peer_id" />
          <Forwarded v-if="msg.fwdCount" :msg="msg" />

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

  export default {
    props: ['msg', 'peer', 'peer_id', 'messageDate', 'isStartUnread', 'prevMsg'],
    components: {
      Attachments,
      Reply,
      Forwarded,
      Keyboard
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
        const isSticker = !!attachments.sticker;
        const isPhoto = !!attachments.photo;
        const attachNames = Object.keys(attachments);
        const onlyPhotos = !isReplyMsg && !fwdCount &&
              isPhoto && attachNames.length == 1;
        let flyTime = false;

        if(isSticker) classes.push('isSticker');
        if(attachNames[0] == 'photo') classes.push('isStartPhoto');
        if(onlyPhotos) classes.push('onlyPhotos');
        if(isSticker || onlyPhotos) flyTime = true;

        if(onlyPhotos && !text) {
          // Уменьшаем отступы со всех сторон
          classes.push('removeMargin');
          flyTime = true;
        } else if(!text && !isReplyMsg && isPhoto) {
          // Уменьшаем отступы сверху, справа и слева
          classes.push('removeTopMargin');
        } else if(attachNames[attachNames.length-1] == 'photo' && !fwdCount) {
          // Уменьшаем отступы слева, снизу и справа
          classes.push('removeBottomMargin');
          flyTime = true;
        }

        if(
          isSticker && !isReplyMsg ||
          !text && onlyPhotos && attachments.photo.length == 1
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
    margin: 6px 0 0 6px;
  }

  .message_wrap.flyTime .message_time_wrap {
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: #ffffffdf;
    border-radius: 9px;
    padding: 2px 6px;
  }

  .message_wrap.isSticker:not(.hideBubble) .message_time_wrap {
    right: 3px;
    bottom: 3px;
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
    left: -15px;
  }

  .message_wrap.isUnread:not(.out) .message_bubble::after {
    content: '';
    right: -15px;
  }

  .message_wrap.isLoading .message_bubble::before {
    content: '';
    width: 18px;
    height: 18px;
    left: -20px;
    bottom: 7px;
    background: url(~assets/recent.svg) center / contain;
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

  .message_wrap.isStartPhoto .message_text:not(:empty) {
    margin: 0 0 5px 5px;
    float: left;
  }

  .message_wrap.removeMargin .attach_photos > img:first-child,
  .message_wrap.removeTopMargin .attach_photos > img:first-child {
    border-top-left-radius: 14px;
  }

  .message_wrap.removeMargin .attach_photos img.lastColumn:first-child,
  .message_wrap.removeTopMargin .attach_photos img.lastColumn:first-child {
    border-top-right-radius: 14px;
  }

  .message_wrap.removeMargin .attach_photos img.lastRow:first-child,
  .message_wrap.removeMargin .attach_photos br + img.lastRow,
  .message_wrap.removeBottomMargin .attach_photos img.lastRow:first-child {
    border-bottom-left-radius: 14px;
  }

  .message_wrap.removeMargin .attach_photos img.lastRow.lastColumn,
  .message_wrap.removeBottomMargin .attach_photos img.lastRow.lastColumn {
    border-bottom-right-radius: 14px;
  }


  .message_wrap.removeMargin .message_bubble {
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
