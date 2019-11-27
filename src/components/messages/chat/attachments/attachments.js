import PhotosLayout from './PhotosLayout.vue';
import Sticker from './Sticker.vue';
import Documents from './Documents.vue';

export const supportedAttachments = new Set([
  'sticker',
  'photo',
  'doc',
  'video'
]);

export const preloadAttachments = new Set([
  'photo',
  'doc',
  'video'
]);

export default {
  photosLayout: PhotosLayout,
  sticker: Sticker,
  doc: Documents
}
