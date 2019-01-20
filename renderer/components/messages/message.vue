<template>
  <div class="message_wrap">
    <div class="message_top_date" v-if="historyDate">{{ historyDate }}</div>
    <div class="message_unreaded_messages" v-if="unreadMsg">
      <span>{{ l('im_unread_messages') }}</span>
    </div>
    <div :class="{ from_me: isOwner, first_msg_block: isFirstMsg, service: serviceMessage }"
          class="message" :id="'message' + this.msg.id">
      <img v-if="showUserData" class="message_photo" :src="photo">
      <div v-else-if="isChat && !peer.channel && !serviceMessage" class="message_empty_photo"></div>
      <div class="message_content">
        <div class="message_name" v-if="showUserData">{{ name }}</div>
        <div class="message_text_wrap" :class="{ outread, hasText: !!msg.text, morePhotos, onlyPhotos }">
          <div v-if="serviceMessage" class="message_text" v-html="serviceMessage"></div>
          <div v-else class="message_text" v-emoji.color_push.br.link>{{ msg.text }}</div>
          <div class="message_attachments">
            <component v-for="attach of attachments"
                       :is="'attachment-' + attach.type"
                       :data="attach.data"></component>
          </div>
          <div class="message_time_wrap" :class="{ fly: flyMsgTime }">
            <template v-if="msg.edited">
              <div class="message_edited">{{ l('im_edited_msg') }}</div>
              <div class="dot"></div>
            </template>
            <div class="message_time">{{ time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  const { loadProfile, getServiceMessage, getDate } = require('./methods');

  module.exports = {
    props: {
      msg: {
        type: Object,
        required: true
      },
      peer: {
        type: Object,
        required: true
      }
    },
    computed: {
      isChat() {
        return this.peer.id > 2e9;
      },
      prevMsg() {
        let messages = this.$store.state.messages[this.peer.id],
            msgIndex = messages.findIndex(({ id }) => id == this.msg.id);

        return messages[msgIndex - 1];
      },
      isFirstMsg() {
        return this.historyDate || !this.prevMsg || this.prevMsg.from != this.msg.from;
      },
      historyDate() {
        let date = new Date(this.msg.date * 1000),
            time = getDate(this.msg.date);

        if(this.prevMsg) {
          let prevDate = new Date(this.prevMsg.date * 1000);
          if(prevDate.toLocaleDateString() != date.toLocaleDateString()) return time;
        } else return time;
      },
      showUserData() {
        if(this.serviceMessage || this.isOwner || !this.isChat || this.peer.channel) return false;
        if(!(this.prevMsg && this.prevMsg.action || this.unreadMsg) && !this.isFirstMsg) return false;
        return true;
      },
      unreadMsg() {
        if(this.msg.outread) return;
        let hasPrevUnread = this.prevMsg && this.prevMsg.unread;
        if(this.msg.unread && !hasPrevUnread) return true;
      },
      isOwner() {
        return this.msg.from == this.$root.user.id;
      },
      user() {
        let user = this.$store.state.profiles[this.msg.from];
        if(!user || !user.photo_50) loadProfile(this.msg.from);

        return user || { id: this.msg.from };
      },
      photo() {
        return this.user.photo_50;
      },
      name() {
        let userName = this.user.photo_50 ? `${this.user.first_name} ${this.user.last_name}` : '...';

        return this.user.name || userName;
      },
      flyMsgTime() {
        if(!this.attachments.length) return false;
        return this.attachments[this.attachments.length - 1].type == 'photo';
      },
      serviceMessage() {
        if(!this.msg.action) return;

        return getServiceMessage.bind(this)(this.msg.action, this.user, true);
      },
      morePhotos() {
        return this.attachments.filter(({ type }) => type == 'photo').length > 1;
      },
      onlyPhotos() {
        if(!this.attachments.length) return false;
        
        return this.attachments.every(({ type }) => type == 'photo');
      },
      supportedAttachments() {
        return ['photo'];
      },
      attachments() {
        if(!this.msg.loaded) return [];
        let attachments = [];

        if(this.msg.isReplyMsg) {
          attachments.push({
            type: 'reply-msg',
            data: this.msg.replyMsg
          });
        }

        if(this.msg.fwdCount) {
          attachments.push({
            type: 'forwarded-messages',
            data: this.msg.fwdMessages
          });
        }

        for(let attachment of this.msg.attachments) {
          let attach = {};

          if(!this.supportedAttachments.includes(attachment.type)) {
            attach = {
              type: 'default',
              data: this.l('attachments', attachment.type)
            }
          } else {
            let type = attachment.type;

            if(type == 'photo' && this.serviceMessage) {
              attachment[type].isServiceMsg = true;
            }

            attach = {
              type: type.replace(/_/g, '-'),
              data: attachment[type]
            }
          }

          attachments.push(attach);
        }

        return attachments;
      },
      outread() {
        return this.msg.outread || this.msg.unread;
      },
      time() {
        let date = new Date(this.msg.date * 1000),
            f = (t) => t < 10 ? `0${t}` : t;

        return `${date.getHours()}:${f(date.getMinutes())}`;
      }
    }
  }
</script>
