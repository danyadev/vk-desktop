<script>
  import { eventBus, getPhotoFromSizes } from 'js/utils';
  import photosLayout from './photosLayout';

  export default {
    props: ['peer_id', 'attachments'],

    data() {
      return {
        parentWidth: this.calcParentWidth(),
        parentHeight: this.calcParentHeight()
      }
    },

    methods: {
      calcParentWidth() {
        const list = this.$parent.$parent.$parent.$parent.$el;
        return list ? (list.clientWidth * .75 - 14*2 - 12*2) : 0;
      },
      calcParentHeight() {
        const list = this.$parent.$parent.$parent.$parent.$el;
        return list ? (list.scrollHeight * .70) : 0;
      }
    },

    computed: {
      photos() {
        const { photo, video, doc } = this.attachments;
        const photos = [];

        if(photo) {
          photos.push(
            ...photo.map(({ sizes }) => getPhotoFromSizes(sizes, 'x'))
          );
        }

        if(video) {
          function parseDuration(time) {
            const addZero = (num) => num < 10 ? `0${num}` : num;
            const hours = addZero(Math.floor(time / 3600));
            const minutes = addZero(Math.floor((time - (hours * 3600)) / 60));
            const seconds = addZero(time - (hours * 3600) - (minutes * 60));

            return `${hours>0 ? `${hours}:` : ''}${minutes}:${seconds}`;
          }

          photos.push(
            ...video.map((video) => {
              return Object.assign(video.image[video.image.length-2], {
                isVideo: true,
                duration: parseDuration(video.duration)
              });
            })
          );
        }

        if(doc) {
          photos.push(
            ...doc.map((doc) => {
              return Object.assign(getPhotoFromSizes(doc.preview.photo.sizes, 'o'), {
                isDoc: true,
                ext: doc.ext
              });
            })
          );
        }

        if(!photos.length) return [];

        return photosLayout({
          thumbs: photos,
          margin: 5,
          parentWidth: Math.min(this.parentWidth, this.parentHeight),
          parentHeight: this.parentHeight
        });
      }
    },

    render(h) {
      const children = [];
      let generatedColumn = false;
      let height = 0;
      let isFirstRow = false;

      function prepareStyle({ width, height }) {
        return {
          width: `${width}px`,
          height: `${height}px`
        };
      }

      function generateImg(props) {
        const beforeEl = props.isVideo || props.isDoc;

        return h('div', {
          class: ['attach_photo_wrap', {
            isVideo: props.isVideo,
            lastColumn: props.lastColumn,
            lastRow: props.lastRow,
            endFirstRow: props.endFirstRow
          }],
          style: prepareStyle(props)
        }, [
          beforeEl && h('div', { class: 'attach_photo_type' }, props.isVideo ? props.duration : props.ext.toUpperCase()),
          h('img', {
            class: ['attach_photo'],
            domProps: {
              src: props.url || props.src
            }
          })
        ]);
      }

      for(const index in this.photos) {
        const props = this.photos[index];
        const nextProps = this.photos[+index+1];

        if(generatedColumn && props.columnItem) continue;

        if(props.lastColumn && !isFirstRow) {
          props.endFirstRow = true;
          isFirstRow = true;
        }

        if(props.columnItem) {
          generatedColumn = true;

          const photos = [];

          for(const photo of this.photos) {
            if(photo.columnItem) photos.push(generateImg(photo));
          }

          children.push(h('span', photos));
        } else {
          if(props.lastColumn || nextProps.columnItem) {
            height += props.height + (props.lastRow ? 0 : 5);
          }

          children.push(generateImg(props));
        }

        if(props.lastColumn && !props.lastRow) children.push(h('br'));
      }

      return h('div', { class: 'attach_photos_wrap' }, [
        h('div', {
          class: 'attach_photos',
          style: { height: `${height}px` }
        }, children)
      ]);
    },

    mounted() {
      let prevWidth, prevHeight;

      eventBus.on('resize', ({ width, height }) => {
        const { name, params } = this.$router.currentRoute;
        if(name != 'chat' || params.id != this.peer_id) return;

        if(width != prevWidth) {
          this.parentWidth = this.calcParentWidth();
          prevWidth = width;
        }

        if(height != prevHeight) {
          this.parentHeight = this.calcParentHeight();
          prevHeight = height;
        }
      });
    },

    activated() {
      // За время отсутствия в текущей беседе высота и ширина окна могла измениться
      this.parentWidth = this.calcParentWidth();
      this.parentHeight = this.calcParentHeight();
    }
  }
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
  }

  .attach_photo_type {
    position: absolute;
    display: flex;
    align-items: center;
    top: 5px;
    left: 5px;
    background: #000000aa;
    color: #f5f5f5;
    font-size: 11px;
    border-radius: 8px;
    padding: 3px 7px 2px 5px;
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
    width: 15px;
    height: 15px;
    margin: -1px 2px 0 0;
    background: url(~assets/play.svg) center / contain;
  }

  .attach_photo {
    object-fit: cover;
    border-radius: 10px;
    max-width: 100%;
    width: 100%;
    height: 100%;
  }

  .attach_photo_wrap:not(.lastColumn) {
    margin-right: 5px;
  }

  .attach_photo_wrap:not(.lastRow) {
    margin-bottom: 5px;
  }
</style>
