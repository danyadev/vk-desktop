<template>
  <span v-html="emoji(escape(this.$slots.default[0].text))"></span>
</template>
