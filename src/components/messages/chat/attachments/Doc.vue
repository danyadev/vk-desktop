<template>
  <div class="attach_doc">
    <div class="attach_doc_icon">
      <img src="~assets/document.svg">
    </div>
    <div class="attach_doc_info">
      <div class="attach_doc_name link" @click="openInBrowser">{{ attach.title }}</div>
      <div class="attach_doc_type">
        {{ size }}
        <div class="attach_doc_dot"></div>
        <div v-if="loading">{{ progress }}%</div>
        <div v-else-if="loaded">{{ l('downloaded') }}</div>
        <div v-else class="link" @click="download">{{ l('download') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs } from 'vue';
import electron from 'electron';
import request from 'js/request';
import { downloadFile } from 'js/utils';

export default {
  props: ['attach'],

  setup(props) {
    const state = reactive({
      loading: false,
      loaded: false,
      progress: 0
    });

    // eslint-disable-next-line vue/no-setup-props-destructure
    const bytes = props.attach.size;
    const MB = 1 << 20;
    const KB = 1 << 10;
    let size;

    if (bytes >= MB) {
      size = (bytes / MB).toFixed(1) + ' MB';
    } else if (bytes >= KB) {
      size = (bytes / KB).toFixed(1) + ' KB';
    } else {
      size = bytes + ' B';
    }

    function openInBrowser() {
      electron.shell.openExternal(props.attach.url.replace('&no_preview=1', ''));
    }

    async function download() {
      state.loading = true;

      await downloadFile({
        async getUrl() {
          const { headers } = await request(props.attach.url, { raw: true });
          return headers.location;
        },

        progress({ progress }) {
          state.progress = progress.toFixed(2);
        }
      });

      state.loading = false;
      state.loaded = true;
    }

    return {
      ...toRefs(state),
      size,
      openInBrowser,
      download
    };
  }
};
</script>

<style>
.attach_doc {
  display: flex;
}

.message.hasForward .message_bubble_content > .im_attachments > .attach_doc {
  margin-bottom: 8px;
}

.attach_doc_icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  padding: 6px;
  margin-right: 6px;
}

.attach_doc_info {
  font-size: 13px;
  padding-top: 3px;
}

.attach_doc_name {
  font-weight: 500;
}

.attach_doc_type {
  display: flex;
  margin-top: 2px;
  color: var(--text-dark-steel-gray);
}

.attach_doc_dot {
  width: 2px;
  height: 2px;
  margin: 6px 4px 0 4px;
  border-radius: 50%;
  background-color: var(--text-dark-steel-gray);
}
</style>
