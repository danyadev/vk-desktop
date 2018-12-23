<template>
  <div class="conversations_container">
    <div class="header">
      <menu-button></menu-button>
      <div class="header_name">Сообщения</div>
    </div>
    <div class="conversations_wrap" :class="{ loading }" @scroll="onScroll">
      <conversation v-for="peer in peers" :peer="peer" :key="peer.id"></conversation>
    </div>
  </div>
</template>

<script>
  const { parseConversation, parseMessage, concatProfiles, loadConversation } = require('./methods');

  module.exports = {
    data: () => ({
      loading: true,
      loaded: false
    }),
    computed: {
      peers() {
        return this.$store.getters.peers;
      }
    },
    methods: {
      async load() {
        let { items, profiles = [], groups = [] } = await vkapi('messages.getConversations', {
          offset: this.peers.length,
          extended: true,
          fields: other.fields
        });

        this.$store.commit('addProfiles', await concatProfiles(profiles, groups));

        for(let item of items) {
          let { conversation, last_message } = item;

          this.$store.commit('addConversation', {
            peer: parseConversation(conversation),
            lastMsg: parseMessage(last_message, conversation)
          });
        }

        this.loading = false;

        if(items.length < 20) {
          this.loaded = true;
          return;
        }

        await this.$nextTick();
        this.onScroll({ target: qs('.conversations_wrap') });
      },
      onScroll: endScroll((vm) => {
        if(!vm.loading && !vm.loaded) {
          vm.load();
          vm.loading = true;
        }
      }, 100),
      async updatePeer(peerID, data, optional) {
        if(!this.peers.length) return;
        data.id = peerID;

        let dialog = this.$store.state.conversations[peerID],
            peer = dialog && dialog.peer;

        if(!peer && !optional) {
          this.$store.commit('addConversation', { peer: data });

          let conversation = await loadConversation(peerID);

          this.updatePeer(peerID, conversation);
        } else this.$store.commit('editPeer', data);
      },
      updateLastMsg(peerID, msg) {
        this.$store.commit('updateLastMsg', {
          peer_id: peerID,
          msg
        })
      },
      moveConversations(peerID, isDelete) {
        this.$store.commit('movePeer', peerID);

        if(isDelete) {
          let peerIndex = this.peers.findIndex(({ id }) => id == peerID);
          if(peerIndex == this.peers.length - 1) this.$store.commit('removePeer', peerID);
        }
      }
    },
    async mounted() {
      let longpoll = await require('./../../js/longpoll').load();
      this.load();

      let checkTyping = (data) => {
        let peer = this.$store.state.typing[data.peer.id];

        if(peer && peer[data.msg.from]) {
          this.$store.commit('removeTyping', {
            id: data.msg.from,
            peer: data.peer.id
          });
        }
      }

      let removeTyping = async (data) => {
        let user = this.$store.state.typing[data.peer_id][data.from_id];

        if(!user) return;

        if(user.time) {
          this.$store.commit('setTyping', {
            id: data.from_id,
            peer: data.peer_id,
            data: { type: data.type, time: user.time - 1 }
          });

          await other.timer(1000);
          return removeTyping(data);
        }

        this.$store.commit('removeTyping', {
          id: data.from_id,
          peer: data.peer_id
        });
      }

      longpoll.on('new_message', async (data) => {
        this.$store.commit('addMessage', {
          peer_id: data.peer.id,
          msg: data.msg
        });

        if(data.msg.hidden) return;

        this.updateLastMsg(data.peer.id, data.msg);

        this.$store.commit('incrementUnreadCount', {
          peer_id: data.peer.id,
          state: !data.msg.outread
        });

        if(data.msg.action) {
          if(['chat_create', 'chat_title_update'].includes(data.msg.action.type)) {
            data.peer.title = data.msg.action.text;
          }

          let inviteUser = data.msg.action.type == 'chat_invite_user',
              isReturnToChat = inviteUser && data.msg.action.mid == this.$root.user.id;

          if(data.msg.action.type == 'chat_photo_update' || isReturnToChat) {
            vkapi('messages.getConversationsById', {
              peer_ids: data.peer.id
            }).then(({ items: [peer] }) => {
              let data = { title: peer.chat_settings.title };

              if(peer.chat_settings.photo) data.photo = peer.chat_settings.photo.photo_50;
              else data.photo = null;

              this.updatePeer(peer.peer.id, data, true);
            });
          }

          if(data.msg.action.type == 'chat_kick_user') {
            if(data.msg.action.mid == this.$root.user.id) {
              data.peer.photo = null;
            }
          }
        }

        this.updatePeer(data.peer.id, data.peer);

        checkTyping(data);
        this.moveConversations(data.peer.id);
      });

      longpoll.on('edit_message', (data) => {
        this.updatePeer(data.peer.id, data.peer, true);
        checkTyping(data);

        this.$store.commit('editMessage', {
          peer_id: data.peer.id,
          msg: Object.assign(data.msg, { edited: true })
        });
      });

      longpoll.on('delete_messages', async (data) => {
        for(let message of data.messages) {
          this.$store.commit('removeMessage', {
            peer_id: data.peer_id,
            msg_id: message.id
          });
        }

        let { msg, unread, out_read, in_read } = await vkapi('execute.getLastMessage', { peer_id: data.peer_id }),
            messages = this.$store.state.messages[data.peer_id],
            lastMsg = msg && parseMessage(msg, { out_read, in_read });

        if(messages && !messages.length) {
          if(!msg) {
            this.$store.commit('removePeer', data.peer_id);
            return;
          }

          this.$store.commit('addMessage', {
            peer_id: data.peer_id,
            msg: lastMsg
          });
        }

        this.updateLastMsg(data.peer_id, lastMsg);
        this.updatePeer(data.peer_id, { unread }, true);
        this.moveConversations(data.peer_id, true);
      });

      longpoll.on('restore_message', async (data) => {
        let { out_read } = await vkapi('execute.getLastMessage', { peer_id: data.peer.id }),
            msg = Object.assign({ outread: out_read < data.msg.id }, data.msg);

        let messages = this.$store.state.messages[data.peer.id] || [],
            ids = messages.map((msg) => msg.id),
            index = other.getNewIndex(ids, data.msg.id);

        if(index == 0) {
          let prevMsgId = await vkapi('execute.getPrevMsg', {
            peer_id: data.peer.id,
            offset: messages.length - 1
          });

          if(prevMsgId != data.msg.id) return;
        }

        this.$store.commit('addMessage', { peer_id: data.peer.id, msg });

        if(messages[messages.length - 1].id == msg.id) {
          this.updateLastMsg(data.peer.id, msg);
          this.moveConversations(data.peer_id);
        }
      });

      longpoll.on('readed_messages', (data) => {
        let messages = this.$store.state.messages[data.peer_id] || [],
            msgs = messages.filter(({ id, outread }) => (id <= data.msg_id && outread));

        for(let msg of msgs) {
          this.$store.commit('editMessage', {
            peer_id: data.peer_id,
            msg: {
              id: msg.id,
              outread: false
            }
          });
        }

        this.$store.commit('editPeer', {
          id: data.peer_id,
          in_read: data.id
        });
      });

      longpoll.on('read_messages', (data) => {
        let messages = this.$store.state.messages[data.peer_id] || [],
            msgs = messages.filter(({ id, unread }) => (id <= data.msg_id && unread));

        for(let msg of msgs) {
          this.$store.commit('editMessage', {
            peer_id: data.peer_id,
            msg: {
              id: msg.id,
              unread: false
            }
          });
        }

        this.updatePeer(data.peer_id, { unread: data.count }, true);
      });

      longpoll.on('change_push_settings', (data) => {
        this.updatePeer(data.peer_id, { muted: !data.state }, true);
      });

      longpoll.on('typing', (data) => {
        this.$store.commit('setTyping', {
          id: data.from_id,
          peer: data.peer_id,
          data: { type: data.type, time: 5 }
        });

        removeTyping(data);
      });

      longpoll.on('online_user', (data) => {
        this.$store.commit('updateProfile', {
          id: data.id,
          online: data.type == 'online',
          online_mobile: data.mobile,
          online_device: data.device,
          last_seen: { time: data.timestramp }
        });
      });

      longpoll.on('delete_peer', (data) => {
        this.$store.commit('removePeer', data.peer_id);

        let messages = this.$store.state.messages[data.peer_id] || [],
            msgs = messages.filter(({ id }) => id <= data.msg_id);

        for(let msg of msgs) {
          this.$store.commit('removeMessage', {
            peer_id: data.peer_id,
            msg_id: msg.id
          });
        }
      });
    }
  }
</script>
