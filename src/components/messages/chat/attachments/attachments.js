import Sticker from './Sticker.vue';
import Photos from './Photos.vue';

export const supportedAttachments = new Set([
  'sticker',
  'photo'
]);

export default {
  sticker: Sticker,
  photo: Photos
}
