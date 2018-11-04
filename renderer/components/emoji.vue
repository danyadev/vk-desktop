<template>
  <span v-html="render()"></span>
</template>

<script>
  module.exports = {
    props: {
      emoji: {
        type: Boolean,
        default: true
      },
      link: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      render() {
        let text = escape(this.$slots.default[0].text);

        if(this.link) text = text.replace(other.regexp.url, '<div class="link">$1</div>');
        if(this.emoji) text = emoji(text);
        if(this.push) text = text.replace(other.regexp.push, '<div class="link">$3</div>');

        return text;
      }
    }
  }
</script>
