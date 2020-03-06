<template>
  <div class="attach_forwarded attach_left_border">
    <ForwardedMessage v-for="fwd of msg.fwdMessages" :key="fwd.id"
                      :messages="msg.fwdMessages" :msg="fwd"
                      :peer_id="peer_id" :fwdDepth="fwdDepth"
    />
  </div>
</template>

<script>
  export default {
    props: ['peer_id', 'msg', 'fwdDepth']
  }
</script>

<style>
  .attach_forwarded {
    position: relative;
    padding-left: 10px;
  }

  .attach_forwarded::before {
    background: var(--im-message-separator);
  }

  .im_attachments + .attach_forwarded {
    margin-top: 5px;
  }
</style>
