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

        let access_token = null,
            authWindow = new BrowserWindow({
              parent: getCurrentWindow(),
              modal: true,
              width: 700,
              height: 600
            });

        authWindow.loadURL('https://oauth.vk.com/authorize?client_id=6717234&display=popup&scope=69632&response_type=token');

        authWindow.on('close', () => {
          if(!access_token) this.disabled = false;
        });

        authWindow.webContents.on('did-navigate', async (event, url) => {
          access_token = (url.match(/access_token=([A-z0-9]{85})/) || [])[1];

          if(access_token) {
            authWindow.close();
            this.loading = true;

            let [ user ] = await vkapi('users.get', { access_token });

            users.set(user.id, Object.assign(user, { access_token }));
            settings.set('activeID', user.id);
            this.$root.auth = false;
          }
        });
      }
    }
  }
</script>
