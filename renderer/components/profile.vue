<template>
  <div class="profile_container">
    <div class="header">
      <open-menu></open-menu>
      <div class="header_name">Моя страница</div>
    </div>
    <div class="profile_wrap">
      <div class="profile_photo_wrap profile_block">
        <img class="profile_photo" :src="user.photo">
      </div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      user: {}
    }),
    async mounted() {
      console.log('Профиль загружен');

      this.user = await vkapi('execute.getProfile', { log: 1 });
    }
  }
</script>
