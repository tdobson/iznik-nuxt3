<template>
  <b-modal
    :id="'newsPhotoModal-' + id"
    ref="modal"
    scrollable
    title="ChitChat photo"
    size="lg"
    no-stacking
  >
    <template #default>
      <div class="container p-0">
        <span @click="rotateLeft">
          <v-icon
            label="Rotate left"
            class="topleft clickme"
            title="Rotate left"
          >
            <v-icon icon="circle" scale="2" />
            <v-icon icon="reply" class="image__icon" />
          </v-icon>
        </span>
        <span @click="rotateRight">
          <v-icon
            label="Rotate right"
            class="topright clickme"
            title="Rotate right"
            flip="horizontal"
          >
            <v-icon icon="circle" scale="2" />
            <v-icon icon="reply" class="image__icon" />
          </v-icon>
        </span>
        <span v-if="mod" @click="remove">
          <v-icon
            label="Remove this photo"
            class="bottomright clickme"
            title="Remove this photo"
          >
            <v-icon icon="circle" scale="2" />
            <v-icon icon="trash-alt" class="image__icon" />
          </v-icon>
        </span>
        <b-img
          lazy
          :src="src + '?' + cacheBust"
          rounded
          fluid
          generator-unable-to-provide-required-alt=""
          @error="brokenImage"
        />
      </div>
    </template>
    <template #footer>
      <div class="d-flex justify-content-end">
        <b-button variant="white" @click="hide"> Close </b-button>
      </div>
    </template>
  </b-modal>
</template>
<script>
import { useNewsfeedStore } from '../stores/newsfeed'
import { useImageStore } from '../stores/image'
import { useModal } from '~/composables/useModal'

export default {
  props: {
    id: {
      type: Number,
      required: true,
    },
    newsfeedid: {
      type: Number,
      required: true,
    },
    src: {
      type: String,
      required: true,
    },
    imgflag: {
      type: String,
      required: true,
    },
    imgtype: {
      type: String,
      required: true,
    },
  },
  setup() {
    const newsfeedStore = useNewsfeedStore()
    const imageStore = useImageStore()

    const { modal, hide } = useModal()

    return {
      newsfeedStore,
      imageStore,
      modal,
      hide,
    }
  },
  data() {
    return {
      cacheBust: Date.now(),
    }
  },
  computed: {
    mod() {
      const me = this.me
      return (
        me &&
        (me.systemrole === 'Moderator' ||
          me.systemrole === 'Admin' ||
          me.systemrole === 'Support')
      )
    },
  },
  methods: {
    remove() {
      this.$emit('remove', this.id)
    },
    async rotate(deg) {
      const data = {
        id: this.id,
        rotate: deg,
        bust: Date.now(),
      }

      data[this.imgflag] = 1
      data.imgtype = this.imgtype

      await this.imageStore.post(data)
      this.cacheBust = Date.now()

      // Refetch the newsfeed entry to update any values in the parents, via the store.
      await this.newsfeedStore.fetch(this.newsfeedid, true)
    },
    rotateLeft() {
      this.rotate(90)
    },
    rotateRight() {
      this.rotate(-90)
    },
    brokenImage(event) {
      event.target.src = '/placeholder.jpg'
    },
  },
}
</script>
<style scoped lang="scss">
.bottomright {
  bottom: 12px;
  right: 10px;
  position: absolute;
}

.topleft {
  top: 12px;
  left: 10px;
  position: absolute;
}

.topright {
  top: 12px;
  right: 10px;
  position: absolute;
}

.container {
  position: relative;
}

.stacked {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;

  svg {
    grid-row: 1 / 2;
    grid-column: 1 / 2;
  }

  svg:nth-child(2) {
    z-index: 10000;
    color: white;
    padding-top: 7px;
    padding-right: 7px;
  }
}
</style>
