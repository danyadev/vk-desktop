<template>
  <div class="emoji_block" :class="{ active }">
    <div class="emoji_list scrollbar">
      <div v-for="(codes, name) of list" class="emoji_block_item">
        <div class="emoji_block_name">{{ l('emojies', name) }}</div>
        <div v-for="code of codes" class="emoji_block_image_wrap" @click="chooseEmoji(code)">
          <div :class="'@' + code" class="emoji_block_image"></div>
        </div>
      </div>
    </div>
    <div class="emoji_bottom">
      <div class="emoji_bottom_item -emoji active"></div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['active'],
    data: () => ({
      entered: false,
      timeout: null
    }),
    computed: {
      list() {
        let emojies = {},
            recentEmojies = this.$store.state.settings.recentEmojies;

        if(Object.keys(recentEmojies).length) {
          emojies.recent = Object.keys(recentEmojies).sort((a, b) => {
            return recentEmojies[a] > recentEmojies[b] ? -1 : 1;
          });
        }

        return Object.assign(emojies, require('./../../json/emojiBox'));
      }
    },
    methods: {
      chooseEmoji(code) {
        this.$emit('chooseEmoji', code);
      },
      leave() {
        this.entered = false;
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
          if(!this.entered) {
            this.$emit('close');
            document.body.removeEventListener('mousemove', this.mousemove);
          } else this.entered = false;
        }, 500);
      },
      mousemove(event) {
        let hasClose = !event.path.find((el) => {
          if(!el.classList) return;
          return el.classList.contains('emoji_block') || el.classList.contains('dialog_input_emoji_btn');
        });

        if(hasClose) this.leave();
        else this.entered = true;
      }
    },
    watch: {
      active(value) {
        if(value) {
          document.body.addEventListener('mousemove', this.mousemove);
        }
      }
    }
  }
</script>
