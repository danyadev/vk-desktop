<template>
  <div class="conversation" :class="{ active: isActive }" @click="openChat">
    <div class="conversation_photo_wrap" :class="online">
      <img v-if="photo" :src="photo" class="conversation_photo">
      <div v-else class="conversation_photo no_photo"></div>
    </div>
    <div class="conversation_content">
      <div class="conversation_title">
        <div class="conversation_name_wrap">
          <div class="conversation_name" v-emoji>{{ chatName | e }}</div>
          <div v-if="owner && owner.verified" class="verified"></div>
          <div v-if="peer.muted" class="messages_muted"></div>
        </div>
        <div class="conversation_time">{{ time }}</div>
      </div>
      <div class="conversation_message_wrap">
        <div v-if="typingMsg" class="typing_wrap">
          <div class="typing_text">{{ typingMsg }}</div>
          <div class="typing">
            <div class="typing_item"></div>
            <div class="typing_item"></div>
            <div class="typing_item"></div>
          </div>
        </div>
        <div v-else class="conversation_message">
          <div class="conversation_author">{{ authorName }}</div>
          <div class="conversation_text" v-emoji.push
              :class="{ conversation_attach: isAttachment }">{{ message }}</div>
        </div>
        <div class="conversation_message_unread"
            :class="{ outread: msg.outread, muted: peer.muted }"
             >{{ peer.unread || '' }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  const { loadProfile } = require('./methods');
  const { getServiceMessage, getDate, toggleChat } = require('./messages');

  module.exports = {
    props: {
      peer: {
        type: Object,
        required: true
      }
    },
    data: (vm) => ({
      isChat: vm.peer.type == 'chat'
    }),
    computed: {
      isActive() {
        return this.$store.state.activeChat == this.peer.id;
      },
      msg() {
        return this.$store.getters.lastMessage(this.peer.id);
      },
      profiles() {
        return this.$store.state.profiles;
      },
      owner() {
        let owner = this.profiles[this.peer.owner];
        if(!this.isChat && (!owner || !owner.photo_50)) loadProfile(this.peer.owner);
        return owner;
      },
      online() {
        if(this.peer.owner > 2e9) return '';
        else if(!this.owner || !this.owner.online) return '';

        return this.owner.online_mobile ? 'mobile' : 'desktop';
      },
      author() {
        let author = this.profiles[this.msg.from] || { id: this.msg.from };
        if(!author.photo_50) loadProfile(this.msg.from);
        return author;
      },
      photo() {
        if(this.isChat) return this.peer.photo;
        else if(this.owner) return this.owner.photo_50;
      },
      chatName() {
        if(this.isChat) return this.peer.title || '...';
        else if(this.owner && this.owner.photo_50) {
          return this.owner.name || `${this.owner.first_name} ${this.owner.last_name}`;
        } else return '...';
      },
      time() {
        return getDate(this.msg.date, true, true);
      },
      authorName() {
        if(this.msg.action || this.peer.channel) return '';
        else if(this.msg.out || this.author.id == this.$root.user.id) return `${this.l('you')}:`;
        else if(this.author.photo_50) {
          if(this.isChat) return `${this.author.name || this.author.first_name}:`;
        } else return '...:';
      },
      message() {
        if(this.msg.action) {
          return getServiceMessage.bind(this)(this.msg.action, this.author || { id: this.msg.from });
        } else if(this.msg.fwd_count && !this.msg.text) {
          let wordID = other.getWordEnding(this.msg.fwd_count);
          return this.l('fwd_msg', wordID, [this.msg.fwd_count]);
        } else return this.getAttachment(this.msg.text, this.msg.attachments[0]);
      },
      isAttachment() {
        return !this.msg.text && (this.msg.fwd_count || !this.msg.action && this.msg.attachments[0]);
      },
      typingMsg() {
        return this.$store.getters.typingMsg(this.peer.id);
      }
    },
    methods: {
      async openChat() {
        toggleChat.bind(this)(this.peer.id);
      },
      getAttachment(message, attachment) {
        if(!attachment || message) return message;

        if(attachment.type == 'link' && attachment.link) {
          if(attachment.link.url.match('https://m.vk.com/story')) attachment.type = 'story';
        }

        let attachName = this.l('attachments', attachment.type);

        if(!attachName) {
          console.warn('[messages] Неизвестное вложение:', attachment.type);
        }

        return attachName || this.l('attach');
      }
    }
  }
</script>
