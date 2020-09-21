import Sticker from './Sticker.vue';
import Wall from './Wall.vue';
import WallReply from './WallReply.vue';

export const supportedAttachments = new Set([
  'sticker',
  'wall',
  'wall_reply'
]);

export default {
  sticker: Sticker,
  wall: Wall,
  wall_reply: WallReply
};
