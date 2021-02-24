import PhotosLayout from './PhotosLayout.vue';
import Doc from './Doc.vue';
import Sticker from './Sticker.vue';
import Wall from './Wall.vue';
import WallReply from './WallReply.vue';
import Link from './Link.vue';

export const supportedAttachments = new Set([
  'photo', 'video', 'doc',
  'sticker',
  'wall',
  'wall_reply',
  'link'
]);

export default {
  photosLayout: PhotosLayout,
  doc: Doc,
  sticker: Sticker,
  wall: Wall,
  wall_reply: WallReply,
  link: Link
};
