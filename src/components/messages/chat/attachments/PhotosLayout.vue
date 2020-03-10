<script>
  import { eventBus, getPhotoFromSizes } from 'js/utils';
  import photosLayout from './photosLayout';

  export default {
    props: ['peer_id', 'attachments', 'fwdDepth', 'showUserAvatar', 'hideBubble'],

    data() {
      return {
        prevWidth: 0,
        prevHeight: 0,
        maxWidth: 0,
        maxHeight: 0,
        isModal: false
      }
    },

    methods: {
      onResize({ target: { innerWidth, innerHeight } }) {
        if(innerWidth != this.prevWidth) {
          this.maxWidth = this.calcMaxWidth();
          this.prevWidth = innerWidth;
        }

        if(innerHeight != this.prevHeight) {
          this.maxHeight = this.calcMaxHeight();
          this.prevHeight = innerHeight;
        }
      },

      getComputedStyleProperty(selector, prop) {
        return parseFloat(getComputedStyle(this.$el.closest(selector))[prop]);
      },

      calcMaxWidth() {
        const messagesListWidth = this.getComputedStyleProperty(
          this.isModal ? '.modal_wrap' : '.scrolly',
          'width'
        );
        const avatarWidth = this.showUserAvatar ? 45 : 0;
        const internalMessagePadding = this.hideBubble
                                        ? 0
                                        // У пересланных сообщений нет уменьшения отступов
                                        // для основного сообщения
                                        : (this.fwdDepth ? 24 : 12);

        // 1. Отнимает внешний отступ сообщения (14 + 14)
        // 2. Максимальный размер сообщения - 75% от свободного места или 600px
        const messageOuterWidth = Math.min((messagesListWidth - 28) * .75, 600);
        // 3. Иногда у сообщения имеется еще и аватарка отправителя
        // 4. В сообщениях с несколькими фотками внутренний отступ 6 + 6
        //    (или 12 + 12, если пересланное сообщение), а с одной - 0
        // 5. Фотография может находиться внутри пересланного сообщения
        return messageOuterWidth - avatarWidth - internalMessagePadding - 10 * this.fwdDepth;
      },

      calcMaxHeight() {
        if(this.isModal) {
          return this.getComputedStyleProperty('.modal_wrap', 'height') * .92 - 130;
        } else {
          return this.getComputedStyleProperty('.scrolly', 'height') * .7;
        }
      }
    },

    computed: {
      photos() {
        const { photo, video, doc } = this.attachments;
        const photos = [];

        if(photo) {
          photos.push(
            ...photo.map((attach) => ({
              ...getPhotoFromSizes(attach.sizes, 'x'),
              attach
            }))
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
              return Object.assign(video.image[6] || video.image[video.image.length-1], {
                isVideo: true,
                duration: parseDuration(video.duration),
                attach: video
              });
            })
          );
        }

        if(doc) {
          photos.push(
            ...doc.map((doc) => {
              return Object.assign(getPhotoFromSizes(doc.preview.photo.sizes, 'y', true), {
                isDoc: true,
                ext: doc.ext,
                attach: doc
              });
            })
          );
        }

        if(!photos.length || !this.maxWidth) return [];

        return photosLayout({
          thumbs: photos,
          margin: 5,
          maxWidth: this.maxWidth,
          maxHeight: this.maxHeight
        });
      }
    },

    render(h) {
      const children = [];
      let generatedColumn = false;
      let isEndFirstRow = false;
      let height = 0;

      function generateImg(props) {
        const beforeEl = props.isVideo || props.isDoc;

        return h('div', {
          class: ['attach_photo_wrap', {
            isVideo: props.isVideo,
            lastColumn: props.lastColumn,
            lastRow: props.lastRow,
            endFirstRow: props.endFirstRow
          }],
          style: {
            width: `${props.width}px`,
            height: `${props.height}px`
          },
          on: {
            click() {
              eventBus.emit('modal:open', 'media-viewer', { attach: props.attach });
            }
          }
        }, [
          beforeEl && h('div', { class: 'attach_photo_type' }, props.isVideo ? props.duration : props.ext.toUpperCase()),
          h('img', {
            class: ['attach_photo'],
            domProps: {
              src: props.url || props.src,
              loading: 'lazy',
              width: props.width,
              height: props.height
            }
          })
        ]);
      }

      for(const index in this.photos) {
        const props = this.photos[index];
        const nextProps = this.photos[+index+1];

        if(generatedColumn && props.columnItem) continue;

        if(props.lastColumn && !isEndFirstRow) {
          props.endFirstRow = true;
          isEndFirstRow = true;
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
      window.addEventListener('resize', this.onResize);

      this.isModal = !!this.$el.closest('.modal');
      this.maxWidth = this.calcMaxWidth();
      this.maxHeight = this.calcMaxHeight();
    },

    activated() {
      window.addEventListener('resize', this.onResize);

      this.maxWidth = this.calcMaxWidth();
      this.maxHeight = this.calcMaxHeight();
    },

    destroyed() {
      window.removeEventListener('resize', this.onResize);
    },

    deactivated() {
      window.removeEventListener('resize', this.onResize);
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
    cursor: pointer;
  }

  .attach_photo_type {
    position: absolute;
    display: flex;
    align-items: center;
    top: 5px;
    left: 5px;
    background: var(--photos-background);
    color: var(--photos-text);
    font-size: 11px;
    border-radius: 8px;
    padding: 3px 7px 2px 5px;
    max-width: calc(100% - 8px);
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
