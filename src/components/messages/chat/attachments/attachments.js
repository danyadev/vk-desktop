import PhotosLayout from './PhotosLayout.vue';
import Sticker from './Sticker.vue';
import Doc from './Document.vue';
import Gift from './Gift.vue';

export const supportedAttachments = new Set([
  'sticker',
  'photo',
  'doc',
  'video',
  'gift'
]);

export const preloadAttachments = new Set([
  'photo',
  'doc',
  'video'
]);

export default {
  photosLayout: PhotosLayout,
  sticker: Sticker,
  doc: Doc,
  gift: Gift
}
