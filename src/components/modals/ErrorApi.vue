<template>
  <div class="modal">
    <ModalHeader :closable="false">Internal Server Error</ModalHeader>
    <div class="modal_content">
      {{ l('ml_error_api', [method]) }}<br>
      {{ error.error_msg }}<br>
      Request params:
      {{ params || 'nothing' }}

    </div>
    <div class="modal_footer">
      <Button class="right" @click="click">{{ l('retry') }}</Button>
    </div>
  </div>
</template>

<script>
  import ModalHeader from './ModalHeader.vue';
  import Button from '../UI/Button.vue';

  export default {
    props: ['method', 'error', 'retry'],

    components: {
      ModalHeader,
      Button
    },

    computed: {
      params() {
        const params = (this.error.request_params || []).reduce((obj, data) => {
          obj[data.key] = data.value;
          return obj;
        }, {});

        delete params.method;
        delete params.oauth;
        delete params.lang;

        return Object.keys(params).map((key) => `${key}: ${params[key]}`).join('\n');
      }
    },

    methods: {
      click() {
        this.retry();
        this.$modals.close(this.$attrs.name);
      }
    }
  }
</script>

<style>
  .modal[name=error-api] .modal_content {
    padding: 0 25px;
    word-break: break-all;
    white-space: pre-line;
  }
</style>
