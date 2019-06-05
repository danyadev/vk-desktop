<template>
  <Ripple color="#e6ebf2" class="peer" @click="openChat">
    <div :class="['photo_wrap', online]"><img :src="photo"></div>
    <div class="content">
      <div class="title">
        <div class="name_wrap">
          <div :class="['name', { greenName }]" v-emoji="chatName"></div>
          <div v-if="owner && owner.verified" class="verified"></div>
          <div v-if="peer.muted" class="muted"></div>
        </div>
        <div class="time">{{ time }}</div>
      </div>
      <div class="message_wrap">
        <Typing v-if="hasTyping" :peer_id="this.peer.id" :left="false"/>
        <div v-else class="message">
          <div class="author">{{ authorName }}</div>
          <div :class="['text', { isAttachment, isDeletedContent }]" v-emoji.push="message"></div>
        </div>
        <div :class="['unread', { outread, muted: peer.muted }]">{{ peer.unread || '' }}</div>
      </div>
    </div>
  </Ripple>
</template>

<script>
  import { mapState } from 'vuex';
  import { getServiceMessage, loadConversationMembers } from 'js/messages';
  import { getShortDate } from 'js/date';
  import { getPhoto } from 'js/utils';

  import Ripple from '../UI/Ripple.vue';
  import Typing from './Typing.vue';

  export default {
    props: ['peer', 'msg'],
    components: {
      Ripple,
      Typing
    },
    data() {
      return {
        isChat: this.peer.id > 2e9
      }
    },
    computed: {
      ...mapState(['profiles']),
      owner() {
        return this.profiles[this.peer.owner];
      },
      author() {
        return this.profiles[this.msg.from];
      },
      online() {
        if(this.isChat || this.peer.id < 0 || !this.owner || !this.owner.online) return '';
        else return this.owner.online_mobile ? 'mobile' : 'desktop';
      },
      photo() {
        if(this.isChat) return this.peer.photo || 'assets/im_chat_photo.png';
        else return getPhoto(this.owner);
      },
      chatName() {
        if(this.isChat) return this.peer.title || '...';
        else if(this.owner) return this.owner.name || `${this.owner.first_name} ${this.owner.last_name}`;
        else return '...';
      },
      greenName() {
        return [100, 101, 333].includes(Number(this.peer.id));
      },
      time() {
        return getShortDate(new Date(this.msg.date * 1000));
      },
      authorName() {
        const user = this.$store.getters['users/user'];

        if(this.msg.action || this.peer.channel) return '';
        else if(this.msg.out) return `${this.l('you')}:`;
        else if(!this.isChat) return '';
        else if(this.author) return `${this.author.name || this.author.first_name}:`;
        else return loadConversationMembers(this.peer.id), '...:';
      },
      message() {
        if(this.msg.action) return getServiceMessage(this.msg.action, this.author || { id: this.msg.from });
        else if(this.isAttachment) {
          const { isReplyMsg, fwdCount, attachments } = this.msg;

          if(isReplyMsg) return this.l('im_replied');
          else if(fwdCount) return this.l('im_forwarded', [fwdCount], fwdCount);
          else return this.l('im_attachments', attachments[0].type);
        } else return this.msg.text;
      },
      hasTyping() {
        const typing = this.$store.state.messages.typing[this.peer.id] || {};

        return Object.keys(typing).length;
      },
      isDeletedContent() {
        return !this.message;
      },
      isAttachment() {
        const { msg } = this;
        const isFwd = msg.fwdCount || msg.isReplyMsg;

        return !msg.text && (isFwd || !msg.action && msg.attachments.length);
      },
      outread() {
        return this.peer.out_read != this.peer.last_msg_id;
      }
    },
    methods: {
      openChat() {
        this.$router.replace(`/messages/${this.peer.id}`);
      }
    }
  }
</script>

<style scoped>
  .peer {
    display: flex;
    position: relative;
    transition: background-color .3s;
  }

  .peer:hover {
    background-color: #f5f7fa;
    cursor: pointer;
  }

  .photo_wrap {
    position: relative;
    width: 50px;
    height: 50px;
    margin: 10px 10px 10px 16px;
  }

  .photo_wrap.mobile::after,
  .photo_wrap.desktop::after {
    content: '';
    position: absolute;
    box-sizing: content-box;
    width: 8px;
    bottom: 2px;
    right: -1px;
    border: 2px solid #fff;
  }

  .photo_wrap.mobile::after {
    height: 11px;
    border-radius: 3px;
    background: url('~assets/online_mobile.svg') no-repeat #fff;
  }

  .photo_wrap.desktop::after {
    height: 8px;
    border-radius: 50%;
    background-color: #8ac176;
  }

  .photo_wrap img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
  }

  .content {
    width: calc(100% - 76px);
    padding: 10px 16px 10px 0;
  }

  .peer:not(:last-child) .content { border-bottom: 1px solid #e7e8ec }

  .title {
    display: flex;
    margin-top: 5px;
  }

  .name_wrap {
    display: flex;
    flex-grow: 1;
    overflow: hidden;
    font-weight: 500;
  }

  .name {
    height: 20px;
    line-height: 18px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .name.greenName {
    color: #265b96;
  }

  .verified {
    flex: none;
    margin: 1px 0 0 4px;
  }

  .name_wrap .muted {
    flex: none;
    width: 13px;
    height: 13px;
    margin: 3px 0 0 4px;
    background-image: url('~assets/muted.svg');
    background-size: 13px;
  }

  .time {
    flex: none;
    margin-left: 5px;
    color: #848a96;
    font-size: 13px;
    margin-top: 2px;
  }

  .message_wrap {
    display: flex;
    height: 20px;
    margin-top: 2px
  }

  .message_wrap > div:first-child {
    flex-grow: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-top: 2px;
  }

  .message { color: #4c4d50 }
  .message >>> b { font-weight: 500 }

  .author:not(:empty) {
    display: inline;
    color: #777a7d;
  }

  .text { display: inline }
  .text.isAttachment { color: #254f79 }
  .text.isDeletedContent { color: #4a4a4a }

  .unread {
    padding: 0 6px;
    margin: 2px 0 0 3px;
    border-radius: 10px;
    background-color: #5181b8;
    color: #fff;
    font-size: 11px;
    font-weight: 500;
    line-height: 20px;
  }

  .unread:not(.outread):empty { display: none }
  .unread:not(.outread).muted { background-color: #b2b7c2 }

  .unread.outread {
    flex: none;
    padding: 0;
    margin: 7px 4px 0 4px;
    width: 8px;
    height: 8px;
    background-color: #93adc8;
  }
</style>
