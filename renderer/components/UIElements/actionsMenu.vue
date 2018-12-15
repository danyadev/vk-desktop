<template>
  <div class="actions_menu">
    <div class="actions_menu_item" v-for="item of list">
      <div v-if="item.type == 'separator'" class="actions_menu_sep"></div>
      <div v-else @click="item.click" class="actions_menu_name">{{ item.name }}</div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: {
      list: {
        type: Array,
        default: []
      }
    }
  }
</script>
