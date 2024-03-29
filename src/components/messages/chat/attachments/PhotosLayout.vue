<script>
import { reactive, computed, onMounted, onActivated, getCurrentInstance, watch, nextTick } from 'vue';
import { windowSize } from 'js/utils';
import { getPhotoFromSizes } from 'js/api/utils';
import { format, createDateFrom } from 'js/date/utils';
import { calculatePhotosLayout } from './photosLayout';

function generateImage(photo) {
  return (
    <div
      class={['attach_photo_wrap', {
        isVideo: photo.isVideo,
        lastColumn: photo.lastColumn,
        lastRow: photo.lastRow,
        endFirstRow: photo.endFirstRow
      }]}
      style={{
        width: `${photo.width}px`,
        height: `${photo.height}px`
      }}
    >
      {(photo.isVideo || photo.isDoc) && (
        <div class="attach_photo_type">
          {photo.isVideo ? photo.duration : photo.ext.toUpperCase()}
        </div>
      )}

      <img
        class="attach_photo"
        src={photo.url || photo.src}
        loading="lazy"
        width={photo.width}
        height={photo.height}
      />
    </div>
  );
}

function generateLayout(photos) {
  const children = [];
  let generatedColumn = false;
  let isEndFirstRow = false;
  let height = 0;

  for (const index in photos) {
    const photo = photos[index];
    const nextPhoto = photos[+index + 1];

    if (generatedColumn && photo.columnItem) {
      continue;
    }

    if (photo.lastColumn && !isEndFirstRow) {
      photo.endFirstRow = true;
      isEndFirstRow = true;
    }

    if (photo.columnItem) {
      generatedColumn = true;

      children.push(
        <span>
          {photos.filter((photo) => photo.columnItem).map(generateImage)}
        </span>
      );
    } else {
      if (photo.lastColumn || nextPhoto.columnItem) {
        height += photo.height + (photo.lastRow ? 0 : 5);
      }

      children.push(generateImage(photo));
    }

    if (photo.lastColumn && !photo.lastRow) {
      children.push(<br />);
    }
  }

  return { children, height };
}

// el.clientWidth возвращает сильно округленное значение,
// что время от времени смещает фотографии вниз
// Однако разница в производительности практически отсутствует
function getWidth(el) {
  return parseFloat(getComputedStyle(el).width);
}

export default {
  props: ['attachments'],

  setup(props) {
    const instance = getCurrentInstance();
    let root;

    function calcMaxWidth() {
      const messagesStack = root.closest('.messages_stack_list');
      const bubble = root.closest('.message_bubble');
      const attachments = root.closest('.im_attachments');

      // Ширина сообщения без фотографии и отступов вне bubble
      const msgOuterWidth = getWidth(messagesStack);
      // Отступ внутри bubble от начала фона до старта вложения
      const bubblePadding = getWidth(bubble) - getWidth(attachments);

      state.width = Math.min(msgOuterWidth * .75, 550) - bubblePadding;
    }

    function calcMaxHeight() {
      state.height = Math.min(root.closest('.scrolly').clientHeight * .8, 500);
    }

    function calcMaxSize() {
      calcMaxWidth();
      calcMaxHeight();
    }

    onMounted(async () => {
      root = instance.vnode.el;

      // TODO: завести issue во вью и/или дождаться фикса
      if (!document.body.contains(root)) {
        await nextTick();
      }

      calcMaxSize();
    });

    onActivated(calcMaxSize);

    watch(() => windowSize.width, calcMaxWidth);
    watch(() => windowSize.height, calcMaxHeight);

    const state = reactive({
      width: 0,
      height: 0,

      photos: computed(() => {
        const { photo, video, doc } = props.attachments;
        let photos = [];

        if (photo) {
          photos = photos.concat(
            photo.map((attach) => ({
              ...getPhotoFromSizes(attach.sizes, 'x'),
              attach
            }))
          );
        }

        if (video) {
          photos = photos.concat(
            video.map((attach) => ({
              ...(
                attach.image
                  ? attach.image[6] || attach.image[attach.image.length - 1]
                  : { url: 'assets/video_placeholder.png', width: 800, height: 450 }
              ),
              isVideo: true,
              duration: format(
                createDateFrom(attach.duration * 1000),
                attach.duration >= 3600 ? 'hh:mm:ss' : 'mm:ss'
              ),
              attach
            }))
          );
        }

        if (doc) {
          photos = photos.concat(
            doc.map((attach) => ({
              ...getPhotoFromSizes(attach.preview.photo.sizes, 'y', true),
              isDoc: true,
              ext: attach.ext,
              attach
            }))
          );
        }

        if (!photos.length || !state.width) {
          return [];
        }

        return calculatePhotosLayout({
          thumbs: photos,
          margin: 5,
          maxWidth: state.width,
          maxHeight: state.height
        });
      })
    });

    return () => {
      const { height, children } = generateLayout(state.photos);

      return (
        <div class="attach_photos_wrap">
          <div class="attach_photos" style={{ height: `${height}px` }}>
            {children}
          </div>
        </div>
      );
    };
  }
};
</script>

<style>
.attach_photos_wrap {
  vertical-align: middle;
  width: 100%;
}

.attach_photos {
  width: fit-content;
  margin: 0 auto;
  max-width: 100%;
}

.attach_photos span {
  display: inline-flex;
  flex-direction: column;
}

.attach_photo_wrap {
  display: inline-block;
  position: relative;
  float: left;
  max-width: 100%;
  cursor: pointer;
}

.attach_photo_type {
  position: absolute;
  display: flex;
  align-items: center;
  top: 5px;
  left: 5px;
  background: #000a;
  color: var(--text-white);
  font-size: 11px;
  border-radius: 8px;
  padding: 3px 7px 3px 5px;
  max-width: calc(100% - 8px);
  white-space: nowrap;
  overflow: hidden;
  pointer-events: none;
}

.attach_photo_wrap:not(.isVideo) .attach_photo_type {
  font-size: 12px;
  padding: 2px 6px 2px 6px;
}

.attach_photo_wrap.isVideo .attach_photo_type::before {
  content: '';
  display: inline-block;
  flex: none;
  width: 16px;
  height: 16px;
  margin: -1px 2px 0 0;
  -webkit-mask-image: url('~assets/play.svg');
  background-color: var(--text-white);
}

.attach_photo {
  object-fit: cover;
  border-radius: 10px;
  max-width: 100%;
  width: 100%;
  height: 100%;
  background: var(--background-black-alpha);
}

.attach_photo_wrap:not(.lastColumn) {
  margin-right: 5px;
}

.attach_photo_wrap:not(.lastRow) {
  margin-bottom: 5px;
}
</style>
