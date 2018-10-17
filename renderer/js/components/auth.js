'use strict';

module.exports = {
  props: ['auth'],
  data: () => ({
    disableButton: false,
    loading: false
  }),
  methods: {
    async enterAuth() {
      this.disableButton = true;

      let accessToken = null,
          authWindow = new BrowserWindow({
            parent: getCurrentWindow(),
            modal: true,
            width: 700,
            height: 600
          });

      authWindow.loadURL('https://oauth.vk.com/authorize?client_id=6717234&display=popup&scope=136297695&response_type=token');

      authWindow.on('close', () => {
        if(!accessToken) this.disableButton = false;
      });

      authWindow.webContents.on('did-navigate', async (event, url) => {
        accessToken = (url.match(/access_token=([A-z0-9]{85})/) || [])[1];

        if(accessToken) {
          authWindow.close();
          this.loading = true;

          let data = await vkapi('users.get', {
                access_token: accessToken,
                fields: 'status,photo_100,screen_name,nickname'
              }),
              user = data.response[0];

          users.set(user.id, Object.assign(user, { access_token: accessToken }));
          settings.set('activeUser', user.id);
          this.$root.auth = false;
        }
      });
    }
  }
}
