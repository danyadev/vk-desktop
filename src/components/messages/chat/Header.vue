<template>
  <div class="header">
    <img class="header_back" src="~assets/im_back.png" @click="$emit('close')">
    <img class="header_photo" :src="photo">
    <div class="header_center">
      <div class="name_wrap">
        <div class="name" v-emoji="title"></div>
        <div class="verified white" v-if="owner && owner.verified"></div>
        <div class="messages_muted" v-if="peer && peer.muted"></div>
      </div>
      <div class="online">{{ online }}</div>
    </div>
    <img src="~assets/actions_icon.svg" class="actions_btn">
  </div>
</template>

<script>
  import { getLastOnlineDate } from 'js/date';
  
  export default {
    props: ['id'],
    computed: {
      peer() {
        const conversation = this.$store.state.messages.conversations[this.id];

        return conversation && conversation.peer;
      },
      owner() {
        return this.peer && this.$store.state.profiles[this.peer.owner];
      },
      photo() {
        if(this.owner) return this.owner.photo;
        else if(this.peer && this.peer.photo) return this.peer.photo;
        else return 'assets/im_chat_photo.png';
      },
      title() {
        if(this.id > 2e9) return this.peer && this.peer.title || '...';
        else if(this.owner) {
          return this.owner.name || `${this.owner.first_name} ${this.owner.last_name}`;
        } else return '...';
      },
      online() {
        if(!this.peer) return this.l('loading');

        if(this.id < 0) return this.l('im_chat_group');
        else if(this.id > 2e9) {
          const members = this.peer.members;

          if(!this.peer.can_write.allowed) return this.l('im_chat_cant_write');
          else if(this.peer.left) return this.l('im_chat_left');
          else return this.l('im_chat_members', [members], members);
        } else {
          if(!this.owner || !this.owner.last_seen) return this.l('loading');
          else if(this.owner.deactivated) return this.l('im_user_deleted');

          const { online, mobile, time } = this.owner.last_seen;

          if(mobile) return this.l('im_chat_online', 1);
          else if(online) return this.l('im_chat_online', 0);
          else return getLastOnlineDate(new Date(time * 1000), this.owner.sex == 1);
        }
      }
    }
  }
</script>

<style scoped>
  .header_back {
    display: none;
    flex: none;
    width: 40px;
    height: 40px;
    padding: 8px;
    cursor: pointer;
    opacity: .7;
    transition: opacity .3s;
  }

  .header_photo {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    margin: 0 5px 0 5px;
  }

  .header_center {
    flex-grow: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .name_wrap {
    display: flex;
    justify-content: center;
    height: 16px;
  }

  .name_wrap .verified {
    flex: none;
    margin-left: 4px;
  }

  .name_wrap .messages_muted {
    opacity: 0.7;
    background: url('~assets/muted_white.svg') 0 / 13px no-repeat;
    width: 12px;
    margin-left: 3px;
  }

  .name {
    color: #fff;
    line-height: 14px;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, .2);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .online {
    color: rgba(255, 255, 255, 0.75);
    font-size: 13px;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, .2);
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .actions_btn {
    flex: none;
    width: 40px;
    height: 40px;
    padding: 8px;
    cursor: pointer;
    opacity: .7;
    transition: opacity .3s;
  }

  .header_back:hover, .actions_btn:hover {
    opacity: 1;
  }
</style>
