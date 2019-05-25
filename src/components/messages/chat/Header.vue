<template>
  <div class="header">
    <Ripple color="rgba(255, 255, 255, .2)" class="fast header_back" @click="$emit('close')">
      <img src="~assets/im_back.png">
    </Ripple>
    <img class="header_photo" :src="photo">
    <div class="header_center">
      <div class="name_wrap">
        <div class="name" v-emoji="title"></div>
        <div class="verified white" v-if="owner && owner.verified"></div>
        <div class="messages_muted" v-if="peer && peer.muted"></div>
      </div>
      <div class="online ff-roboto">{{ online }}</div>
    </div>
    <img src="~assets/actions_icon.svg" class="actions_btn">
  </div>
</template>

<script>
  import { getLastOnlineDate } from 'js/date';
  import { getPhoto } from 'js/utils';
  import Ripple from '../../UI/Ripple.vue';

  export default {
    props: ['id', 'peer'],
    components: {
      Ripple
    },
    computed: {
      owner() {
        return this.peer && this.$store.state.profiles[this.peer.owner];
      },
      photo() {
        if(this.owner) return getPhoto(this.owner);
        else return this.peer && !this.peer.left && this.peer.photo || 'assets/im_chat_photo.png';
      },
      title() {
        if(this.id > 2e9) {
          return this.peer && this.peer.title || '...';
        } else if(this.owner) {
          return this.owner.name || `${this.owner.first_name} ${this.owner.last_name}`;
        } else return '...';
      },
      online() {
        if(!this.peer || !this.peer.left && this.id > 2e9 && this.peer.members == null) return this.l('loading');
        else if(this.id < 0) return this.l('im_chat_group');
        else if(this.id > 2e9) {
          const { canWrite, members, channel, left } = this.peer;

          if(!canWrite && !channel) return this.l('im_chat_kicked');
          else if(left) return this.l('im_chat_left');
          else return this.l('im_chat_members', [members], members);
        } else {
          if(!this.owner) return this.l('loading');
          else if(this.owner.deactivated) return this.l('im_user_deleted');

          const { online, online_mobile, last_seen: { time } } = this.owner;

          if(online_mobile) return this.l('im_chat_online', 1);
          else if(online) return this.l('im_chat_online', 0);
          else return getLastOnlineDate(new Date(time * 1000), this.owner.sex == 1);
        }
      }
    }
  }
</script>

<style scoped>
  .header_back, .header_back img {
    width: 40px;
    height: 40px;
  }

  .header_back {
    display: none;
    flex: none;
    border-radius: 50%;
    cursor: pointer;
    opacity: .7;
    transition: opacity .3s;
  }

  .header_back img {
    padding: 8px;
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
    margin-top: 2px;
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
