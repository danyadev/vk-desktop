<template>
  <div :class="['typing_wrap', { isChat }]">
    <div class="typing_text text-overflow">{{ text }}</div>
    <div class="typing">
      <div class="typing_item"></div>
      <div class="typing_item"></div>
      <div class="typing_item"></div>
    </div>
  </div>
</template>

<script>
  import { loadConversationMembers } from 'js/messages';
  import getTranslate from 'js/getTranslate';

  export default {
    props: ['peer_id', 'isChat'],

    computed: {
      text() {
        const typing = this.$store.state.messages.typing[this.peer_id];
        const text = [];
        const audio = [];
        let msg = '';

        for(const id in typing) {
          if(typing[id].type == 'text') text.push(id);
          else audio.push(id);
        }

        const name = (id) => {
          const user = this.$store.state.profiles[id];

          if(this.peer_id < 2e9) return '';
          if(!user) return loadConversationMembers(id), '...';
          if(user.name) return user.name;

          return `${user.first_name} ${user.last_name[0] + '.'}`;
        }

        function getText(type, data) {
          switch(data.length) {
            case 1:
              msg += getTranslate(`im_typing_${type}`, 0, [name(data[0])]);
              break;
            case 2:
              msg += getTranslate(`im_typing_${type}`, 1, [name(data[0]), name(data[1])]);
              break;
            default:
              msg += getTranslate(`im_typing_${type}`, 2, [name(data[0]), data.length-1]);
              break;
          }
        }

        if(text.length) getText('text', text);
        if(text.length && audio.length) msg += ` ${getTranslate('and')} `;
        if(audio.length) getText('audio', audio);

        return msg;
      }
    }
  }
</script>

<style>
  .typing_wrap {
    display: flex;
    color: #254f79;
  }

  .typing_wrap.isChat {
    color: rgba(255, 255, 255, .75);
    font-size: 13px;
    margin-top: 2px;
    justify-content: center;
  }

  .typing {
    margin: 0 6px;
    flex: none;
  }

  @keyframes typing {
    0% { opacity: 1 }
    30% { opacity: .5 }
    100% { opacity: 1 }
  }

  .typing_item {
    display: inline-block;
    background: #5281b9;
    margin-bottom: 2px;
    animation: 1.1s linear 0s infinite typing;
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .typing_wrap.isChat .typing_item {
    background: rgba(255, 255, 255, .75);
    margin-bottom: 1px;
  }

  .typing_item:nth-child(2) { animation-delay: .37s }
  .typing_item:nth-child(3) { animation-delay: .74s }
</style>
