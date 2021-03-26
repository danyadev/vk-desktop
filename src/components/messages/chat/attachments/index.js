import PhotosLayout from './PhotosLayout.vue';
import Doc from './Doc.vue';
import Sticker from './Sticker.vue';
import Wall from './Wall.vue';
import WallReply from './WallReply.vue';
import Link from './Link.vue';
import Curator from './Curator.vue';
import Artist from './Artist.vue';
import Article from './Article.vue';

export const supportedAttachments = new Set([
  'photo',
  'video',
  'doc',
  'sticker',
  'wall',
  'wall_reply',
  'link',
  'narrative',
  'audio_playlist',
  'curator',
  'artist',
  'article'
]);

export default {
  photosLayout: PhotosLayout,
  doc: Doc,
  sticker: Sticker,
  wall: Wall,
  wall_reply: WallReply,
  link: Link,
  narrative: Link,
  audio_playlist: Link,
  curator: Curator,
  artist: Artist,
  article: Article
};
