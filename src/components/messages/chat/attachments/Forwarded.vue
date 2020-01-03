<template>
  <div class="attach_forwarded attach_left_border">
    <ForwardedMessage v-for="fwd of msg.fwdMessages" :key="fwd.id"
                      :messages="msg.fwdMessages" :msg="fwd"
                      :peer_id="peer_id" :fwdDepth="fwdDepth"
    />
  </div>
</template>

<script>
  import ForwardedMessage from './ForwardedMessage.vue';

  export default {
    name: 'forwarded',

    props: ['peer_id', 'msg', 'fwdDepth'],

    components: {
      ForwardedMessage
    }
  }
</script>

<style>
  .attach_forwarded {
    position: relative;
    padding-left: 10px;
  }

  .attach_forwarded::before {
    background: #7197c5;
  }

  .im_attachments + .attach_forwarded {
    margin-top: 5px;
  }
</style>
