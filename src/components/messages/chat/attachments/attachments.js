import PhotosLayout from './PhotosLayout.vue';
import Sticker from './Sticker.vue';
import Documents from './Documents.vue';

export const supportedAttachments = new Set([
  'sticker',
  'photo',
  'doc',
  'video'
]);

export default {
  _preload: new Set(['photo', 'doc', 'video']),
  photosLayout: PhotosLayout,

  sticker: Sticker,
  doc: Documents
}
