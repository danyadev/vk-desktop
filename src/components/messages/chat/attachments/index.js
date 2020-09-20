import Sticker from './Sticker.vue';
import WallReply from './WallReply.vue';

export const supportedAttachments = new Set([
  'sticker',
  'wall_reply'
]);

export default {
  sticker: Sticker,
  wall_reply: WallReply
};
