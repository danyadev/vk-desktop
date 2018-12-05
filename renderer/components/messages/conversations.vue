<template>
  <div class="conversations_container">
    <div class="header">
      <menu-button></menu-button>
      <div class="header_name">Сообщения</div>
    </div>
    <div class="conversations_wrap" :class="{ loading }" @scroll="onScroll">
      <conversation v-for="peer in peers" :key="peer.id" :peer="peer"></conversation>
    </div>
  </div>
</template>

<script>
  const { parseConversation, parseMessage, concatProfiles, getLastMessage } = require('./methods');

  module.exports = {
    data: () => ({
      loading: true
    }),
    computed: {
      peers() {
        return this.$store.state.peers;
      }
    },
    methods: {
      async load() {
        let { items, profiles = [], groups = [] } = await vkapi('messages.getConversations', {
          extended: true,
          fields: 'photo_50,verified,sex,first_name_acc,last_name_acc,online',
          offset: this.peers.length
        });

        this.$store.commit('addProfiles', concatProfiles(profiles, groups));

        for(let item of items) {
          let { conversation, last_message } = item;

          this.$store.commit('addMessage', {
            peer_id: conversation.peer.id,
            msg: parseMessage(last_message, conversation)
          });

          this.peers.push(parseConversation(conversation));
        }

        this.loading = false;

        if(items.length < 20) return;

        await this.$nextTick();
        this.onScroll({ target: qs('.conversations_wrap') });
      },
      onScroll: endScroll((vm) => {
        if(!vm.loading) {
          vm.load();
          vm.loading = true;
        }
      }, 100),
      async updatePeer(peerID, data, optional) {
        if(this.peers.length == 0) return;

        let index = this.peers.findIndex((peer) => peer.id == peerID),
            peer = this.peers[index];

        if(data instanceof Function) data = data(peer);
        if(data instanceof Promise) data = await data;

        if(!peer && !optional) {
          this.peers.unshift(data);

          let { items: [conv], profiles = [], groups = [] } = await vkapi('messages.getConversationsById', {
            peer_ids: peerID,
            extended: 1,
            fields: 'photo_50,verified,sex,first_name_acc,last_name_acc,online'
          });

          this.$store.commit('addProfiles', concatProfiles(profiles, groups));

          this.updatePeer(peerID, parseConversation(conv));
        } else Vue.set(this.peers, index, Object.assign({}, peer, data || {}));
      },
      moveConversations(peerID, isDelete) {
        let index = this.peers.findIndex((peer) => peer.id == peerID);

        if(index != -1) {
          if(!isDelete) this.peers.move(index, 0);
          else {
            this.peers.sort((p1, p2) => {
              return getLastMessage(p1.id).date < getLastMessage(p2.id).date ? 1 : -1;
            });

            let peerIndex = this.peers.findIndex((peer) => peer.id == peerID);
            if(peerIndex == this.peers.length - 1) Vue.delete(this.peers, peerIndex);
          }
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
        else if(user.time) {
          this.$store.commit('addTyping', {
            id: data.from_id,
            peer: data.peer_id,
            data: { type: data.type, time: user.time - 1 }
          });

          await other.timer(1000);
          removeTyping(data);
          return;
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

        this.updatePeer(data.peer.id, (oldPeer) => {
          if(data.msg.outread) data.peer.unread = 0;
          else if(oldPeer) data.peer.unread = oldPeer.unread + 1;

          if(data.msg.action) {
            if(['chat_create', 'chat_title_update'].includes(data.msg.action.type)) {
              data.peer.title = data.msg.action.text;
            }

            let inviteUser = data.msg.action.type == 'chat_invite_user',
                isReturnToChat = inviteUser && data.msg.action.mid == users.get().id;

            if(data.msg.action.type == 'chat_photo_update' || isReturnToChat) {
              vkapi('messages.getConversationsById', {
                peer_ids: data.peer.id
              }).then(({ items: [peer] }) => {
                let data = { title: peer.chat_settings.title };

                if(peer.chat_settings.photo) data.photo = peer.chat_settings.photo.photo_50;
                else data.photo = null;

                this.updatePeer(peer.peer.id,  data);
              });
            }

            if(data.msg.action.type == 'chat_kick_user') {
              if(data.msg.action.mid == users.get().id) {
                data.peer.photo = null;
              }
            }
          }

          return data.peer;
        });

        checkTyping(data);
        this.moveConversations(data.peer.id);
      });

      longpoll.on('edit_message', (data) => {
        this.updatePeer(data.peer.id, data.peer, true);
        checkTyping(data);

        this.$store.commit('editMessage', {
          peer_id: data.peer.id,
          msg: data.msg
        });
      });

      longpoll.on('delete_message', async (data) => {
        let peer = this.$store.state.dialogs.find((peer) => peer.id == data.peer_id);
        if(!peer) return;

        let items = peer.items,
            msgIndex = items.findIndex((msg) => msg.id == data.id),
            { msg, unread, outread } = await vkapi('execute.getLastMessage', { peer_id: data.peer_id });

        if(msg) this.$store.commit('addMessage', {
          peer_id: data.peer_id,
          msg: parseMessage(msg, { outread })
        });

        if(data.all) {
          this.$store.commit('removeMessage', {
            peer_id: data.peer_id,
            id: data.id
          });
        } else {
          this.$store.commit('editMessage', {
            peer_id: data.peer_id,
            msg: {
              id: data.id,
              deleted: true
            }
          });
        }

        this.updatePeer(data.peer_id, { unread }, true);
        this.moveConversations(data.peer_id, true);
      });

      longpoll.on('restore_message', (data) => {
        this.$store.commit('editMessage', {
          force: true,
          peer_id: data.peer.id,
          msg: {
            ...data.msg,
            deleted: false
          }
        });
      });

      longpoll.on('readed_messages', (data) => {
        this.$store.commit('editMessage', {
          peer_id: data.peer_id,
          msg: {
            id: data.id,
            outread: data.count != 0
          }
        });
      });

      longpoll.on('read_messages', (data) => {
        this.updatePeer(data.peer_id, { unread: data.count }, true);
      });

      longpoll.on('change_push_settings', (data) => {
        this.updatePeer(data.peer_id, { muted: !data.state }, true);
      });

      longpoll.on('typing', (data) => {
        this.$store.commit('addTyping', {
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
          online_mobile: !!data.mobile
        });
      });

      longpoll.on('delete_peer', (data) => {
        let index = this.peers.findIndex((peer) => peer.id == data.peer_id);
        if(index != -1) Vue.delete(this.peers, index);
      });
    }
  }
</script>
