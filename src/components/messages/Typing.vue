<template>
  <div class="typing_wrap ff-roboto">
    <div v-if="!left" class="typing_text">{{ text }}</div>
    <div class="typing">
      <div class="typing_item"></div>
      <div class="typing_item"></div>
      <div class="typing_item"></div>
    </div>
    <div v-if="left" class="typing_text">{{ text }}</div>
  </div>
</template>

<script>
  import { loadProfile } from 'js/utils';
  import getTranslate from 'js/getTranslate';

  export default {
    props: {
      // Слева ли должны находиться три точки
      left: {
        type: Boolean,
        default: true
      },
      peer_id: {
        type: [String, Number],
        required: true
      }
    },
    computed: {
      text() {
        const typing = this.$store.state.messages.typing[this.peer_id];
        const text = [];
        const audio = [];
        let msg = '';

        for(const id in typing) {
          if(typing[id].type == 'audio') audio.push(id);
          else text.push(id);
        }

        const name = (id) => {
          // В лс просто отображается "печатает"
          if(this.peer_id < 2e9) return '';

          const user = this.$store.state.profiles[id];
          if(!user) return loadProfile(id), '...';

          return user.name || `${user.first_name} ${user.last_name[0] + '.'}`;
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

<style scoped>
  .typing_wrap {
    display: flex;
    color: #254f79;
  }

  .typing { margin: 0 6px }

  .typing_text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  @keyframes activity_typing {
    0% { opacity: 1 }
    30% { opacity: .5 }
    100% { opacity: 1 }
  }

  .typing_item {
    display: inline-block;
    background-color: #5281b9;
    margin-bottom: 2px;
    animation: 1.1s linear 0s infinite activity_typing;
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .typing_item:nth-child(2) { animation-delay: .37s }
  .typing_item:nth-child(3) { animation-delay: .74s }
</style>
