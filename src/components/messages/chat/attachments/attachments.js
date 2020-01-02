import PhotosLayout from './PhotosLayout.vue';
import Sticker from './Sticker.vue';
import DocumentAttach from './Document.vue';

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
  doc: DocumentAttach
}
