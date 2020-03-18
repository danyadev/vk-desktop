<template>
  <div class="im_peers_container">
    <div class="header">
      <HeaderButton />
      <div class="header_name">{{ l('im_header_title') }}</div>
    </div>
    <div class="im_peers_wrap"></div>
  </div>
</template>

<script>
import HeaderButton from '../HeaderButton.vue';

export default {
  components: {
    HeaderButton
  }
}
</script>

<style>
.im_peers_wrap {
  width: 100%;
  /* 45px - постоянная высота у .header */
  height: calc(100% - 45px);
  border-right: 1px solid #e7e8ec;
}

.im_peers_container .header_name {
  flex-grow: 1;
}

.im_peers_delimiter {
  width: 100%;
  height: 6px;
  background: #e7e8ec;
}
</style>
