<template>
  <div class="attach_forwarded attach_left_border">
    <ForwardedMessage
      v-for="fwd of fwdMessages"
      :key="fwd.id"
      :msg="fwd"
      :peer_id="peer_id"
      :isCustomView="isCustomView"
      :fwdDepth="fwdDepth"
    />
  </div>
</template>

<script>
// ForwardedMessage зарегистрирован глобально, чтобы предотвратить рекурсию при рендере

export default {
  props: ['peer_id', 'msg', 'isCustomView', 'fwdDepth'],

  setup(props) {
    const { fwdMessages, replyMsg } = props.msg;

    return {
      fwdMessages: replyMsg ? [replyMsg] : fwdMessages
    };
  }
};
</script>

<style>
.attach_forwarded {
  position: relative;
  padding-left: 10px;
}

.attach_forwarded::before {
  background: var(--forwarded-left-border);
}

.im_attachments + .attach_forwarded {
  margin-top: 5px;
}
</style>
