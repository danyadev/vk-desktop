import PhotosLayout from './PhotosLayout.vue';
import Sticker from './Sticker.vue';
import Wall from './Wall.vue';
import WallReply from './WallReply.vue';

export const supportedAttachments = new Set([
  'photo',
  'video',
  'doc',
  'sticker',
  'wall',
  'wall_reply'
]);

export default {
  photosLayout: PhotosLayout,
  sticker: Sticker,
  wall: Wall,
  wall_reply: WallReply
};
