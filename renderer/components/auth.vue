<template>
  <div class="auth">
    <div class="auth_wrap">
      <img src="images/logo.png" class="auth_logo">
      <div class="auth_name">VK Desktop</div>
      <button class="button auth_button" @click="enterAuth" :disabled="disabled">Войти</button>
      <div class="loading" v-if="loading"></div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      disabled: false,
      loading: false
    }),
    methods: {
      async enterAuth() {
        this.disabled = true;

        let accessToken = null,
            authWindow = new BrowserWindow({
              parent: getCurrentWindow(),
              modal: true,
              width: 700,
              height: 600
            });

        authWindow.loadURL('https://oauth.vk.com/authorize?client_id=6717234&display=popup&scope=136297695&response_type=token');

        authWindow.on('close', () => {
          if(!accessToken) this.disabled = false;
        });

        authWindow.webContents.on('did-navigate', async (event, url) => {
          accessToken = (url.match(/access_token=([A-z0-9]{85})/) || [])[1];

          if(accessToken) {
            authWindow.close();
            this.loading = true;

            let [ user ] = await vkapi('users.get', {
                  access_token: accessToken,
                  fields: 'status,photo_100,screen_name,nickname,verified'
                });

            users.set(user.id, Object.assign(user, { access_token: accessToken }));
            settings.set('activeID', user.id);
            this.$root.auth = false;
          }
        });
      }
    }
  }
</script>
