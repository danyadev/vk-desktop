<template>
  <div class="im_attach_doc">
    <div class="im_attach_doc_icon">
      <img src="~assets/document.svg">
    </div>
    <div class="im_attach_doc_info">
      <div class="im_attach_doc_name">{{ attach.title }}</div>
      <div class="im_attach_doc_type">
        {{ size }}
        <div class="im_attach_doc_dot"></div>
        <div v-if="loading">{{ progress }}%</div>
        <div v-else-if="loaded">{{ l('downloaded') }}</div>
        <div v-else class="link" @click="download">{{ l('download') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  import { downloadFile } from 'js/utils';

  export default {
    props: ['attach'],

    data() {
      const bytes = this.attach.size;
      const MB = 1 << 20;
    	const KB = 1 << 10;
      let size;

    	if(bytes >= MB) size = (bytes / MB).toFixed(1) + ' MB';
    	else if(bytes >= KB) size = (bytes / KB).toFixed(1) + ' KB';
    	else size = bytes + ' B';

      return {
        size,
        loading: false,
        loaded: false,
        progress: 0
      };
    },

    methods: {
      async download() {
        this.loading = true;

        await downloadFile(this.attach.url, true, ({ progress }) => {
          this.progress = progress.toFixed(2);
        });

        this.loading = false;
        this.loaded = true;
      }
    }
  }
</script>

<style>
  .im_attach_doc {
    display: flex;
  }

  .im_attachments > .im_attach_doc:not(:first-child) {
    padding-top: 10px;
  }

  .im_attach_doc_icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--im-attachs-doc-icon);
    padding: 8px;
    margin-right: 10px;
  }

  .im_attach_doc_info {
    margin-top: 1px;
  }

  .im_attach_doc_name {
    user-select: text;
  }

  .im_attach_doc_type {
    display: flex;
    margin-top: 2px;
    color: var(--im-attachs-doc-size);
  }

  .im_attach_doc_dot {
    width: 2px;
    height: 2px;
    margin: 8px 5px 0 6px;
    border-radius: 50%;
    background: var(--im-attachs-doc-dot);
  }

  .im_attach_doc_type .link {
    color: var(--im-attachs-doc-link);
  }
</style>
