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
    return {
      fwdMessages: props.msg.replyMsg
        ? [props.msg.replyMsg]
        : props.msg.fwdMessages
    };
  }
};
</script>

<style>
.attach_forwarded {
  position: relative;
  padding-left: 10px;
}

.message_text + .attach_forwarded,
.im_attachments + .attach_forwarded {
  margin-top: 5px;
}

.message.hasPhoto .message_bubble_content > .attach_forwarded {
  margin-left: 5px;
}
</style>
