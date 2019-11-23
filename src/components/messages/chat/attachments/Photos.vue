<script>
  import { eventBus } from 'js/utils';
  import photosLayout from './photosLayout';

  export default {
    props: ['peer_id', 'attach'],
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
        if(!this.attach[0]) return [];

        const photos = this.attach.map((photo) => {
          return photo.sizes.find(({ type }) => type == 'x');
        });

        return photosLayout({
          thumbs: photos,
          margin: 5,
          parentWidth: Math.min(this.parentWidth, this.parentHeight),
          parentHeight: this.parentHeight
        });
      }
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
    },
    render(h) {
      const children = [];
      let generatedColumn = false;

      function generateImg(props) {
        return h('img', {
          class: ['attach_photo', {
            lastColumn: props.lastColumn,
            lastRow: props.lastRow
          }],
          style: {
            width: props.width + 'px',
            height: props.height + 'px'
          },
          domProps: {
            src: props.url
          }
        });
      }

      for(const index in this.photos) {
        const props = this.photos[index];

        if(generatedColumn && props.columnItem) continue;

        if(props.columnItem) {
          generatedColumn = true;

          const photos = [];

          for(const photo of this.photos) {
            if(photo.columnItem) photos.push(generateImg(photo));
          }

          children.push(h('span', photos));
        } else {
          children.push(generateImg(props));
        }

        if(props.lastColumn && !props.lastRow) children.push(h('br'));
      }

      return h('div', { class: 'attach_photos_wrap' }, [
        h('div', { class: 'attach_photos' }, children)
      ]);
    }
  }
</script>

<style>
  .attach_photos_wrap {
    display: inline-block;
    vertical-align: middle;
    width: 100%;
  }

  .attach_photos {
    width: fit-content;
    margin: 0 auto;
  }

  .attach_photos span {
    display: inline-flex;
    flex-direction: column;
  }

  .attach_photo {
    object-fit: cover;
    border-radius: 10px;
    float: left;
    max-width: 100%;
  }

  .attach_photo:not(.lastColumn) {
    margin-right: 5px;
  }

  .attach_photo:not(.lastRow) {
    margin-bottom: 5px;
  }
</style>
