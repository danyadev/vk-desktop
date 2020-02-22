<template>
  <div class="header_wrap">
    <div class="header">
      <Ripple color="rgba(255, 255, 255, .2)" class="ripple_fast im_header_back" @click="$emit('close')">
        <img src="~assets/im_back.webp">
      </Ripple>
      <img class="im_header_photo" :src="photo">
      <div class="im_header_center">
        <div class="im_header_name_wrap">
          <div class="im_header_name" v-emoji="title"></div>
          <div v-if="owner && owner.verified" class="verified white"></div>
          <Icon v-if="peer && peer.muted" name="muted" color="#fff" class="im_header_muted" />
        </div>
        <Typing v-if="hasTyping" :peer_id="peer_id" :isChat="true" />
        <div v-else class="im_header_online">{{ online }}</div>
      </div>
      <MessagesChatMenu :peer_id="peer_id" :peer="peer" />
    </div>
    <PinnedMessage v-if="peer && peer.pinnedMsg" :msg="peer.pinnedMsg" :peer_id="peer_id" />
  </div>
</template>

<script>
  import { getLastOnlineDate } from 'js/date';
  import { getPhoto, getAppName } from 'js/utils';

  import Icon from '../../UI/Icon.vue';
  import Ripple from '../../UI/Ripple.vue';
  import MessagesChatMenu from '../../ActionMenus/MessagesChatMenu.vue';
  import PinnedMessage from './PinnedMessage.vue';
  import Typing from '../Typing.vue';

  export default {
    props: ['peer_id', 'peer'],

    components: {
      Icon,
      Ripple,
      MessagesChatMenu,
      PinnedMessage,
      Typing
    },

    computed: {
      owner() {
        return this.$store.state.profiles[this.peer_id];
      },

      photo() {
        if(this.peer_id > 2e9) {
          return this.peer && !this.peer.left && this.peer.photo || 'assets/im_chat_photo.png';
        } else {
          return getPhoto(this.owner) || 'assets/blank.gif';
        }
      },

      title() {
        if(this.peer_id > 2e9) return this.peer && this.peer.title || '...';
        if(this.owner) return this.owner.name || `${this.owner.first_name} ${this.owner.last_name}`;
        return '...';
      },

      online() {
        if(!this.peer || !this.peer.left && this.peer_id > 2e9 && this.peer.members == null) return this.l('loading');
        if(this.peer_id < 0) return this.l('im_chat_group');
        if(this.peer_id > 2e9) {
          const { canWrite, members, channel, left } = this.peer;

          if(!canWrite && !channel) return this.l('im_chat_kicked');
          else if(left) return this.l(channel ? 'im_chat_left_channel' : 'im_chat_left');
          else return this.l('im_chat_members', [members], members);
        }

        if(!this.owner) return this.l('loading');
        if(this.owner.deactivated) return this.l('im_user_deleted');

        const { online, online_mobile, online_app, online_info: info, last_seen } = this.owner;

        if(online) {
          const appName = online_app > 0 && getAppName(online_app);

          if(appName) return this.l('im_chat_online', 2, [appName]);
          else return this.l('im_chat_online', online_mobile ? 1 : 0);
        }

        const isGirl = this.owner.sex == 1;

        if(!info.visible) return this.l(`im_chat_online_${info.status}`, isGirl);
        if(last_seen) return getLastOnlineDate(new Date(last_seen.time * 1000), isGirl);
        // У @id333 не приходит last_seen
        return '';
      },

      hasTyping() {
        const typing = this.$store.state.messages.typing[this.peer_id] || {};
        return !!Object.keys(typing).length;
      }
    }
  }
</script>

<style>
  .im_header_back, .im_header_back img {
    width: 40px;
    height: 40px;
  }

  .im_header_back {
    display: none;
    flex: none;
    border-radius: 50%;
    cursor: pointer;
    opacity: .7;
    transition: opacity .3s;
  }

  .im_header_back:hover {
    opacity: 1;
  }

  .im_header_back img {
    padding: 8px;
  }

  .im_header_photo {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    margin: 0 5px 0 5px;
  }

  .im_header_center {
    flex-grow: 1;
  }

  .im_header_center, .im_header_name, .im_header_online {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .im_header_name_wrap {
    display: flex;
    justify-content: center;
    height: 16px;
  }

  .im_header_name_wrap .verified {
    flex: none;
    margin: 0 0 0 4px;
  }

  .im_header_muted {
    opacity: .7;
    width: 14px;
    height: 16px;
    margin-left: 3px;
  }

  .im_header_name {
    color: #fff;
    line-height: 14px;
  }

  .im_header_online {
    color: rgba(255, 255, 255, .75);
    font-size: 13px;
    text-align: center;
    margin-top: 2px;
  }
</style>
