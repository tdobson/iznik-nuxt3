<template>
  <div class="container p-0">
    <span @touchstart="rotateLeft" @click="rotateLeft">
      <div label="Rotate left" class="topleft clickme" title="Rotate left">
        <v-icon icon="circle" size="2x" />
        <v-icon icon="reply" class="image__icon" />
      </div>
    </span>
    <span @touchstart="rotateRight" @click="rotateRight">
      <div label="Rotate right" class="topright clickme" title="Rotate right">
        <v-icon icon="circle" size="2x" />
        <v-icon icon="reply" class="image__icon" flip="horizontal" />
      </div>
    </span>
    <span @touchstart="remove" @click="remove">
      <div
        label="Remove this photo"
        class="bottomright clickme"
        title="Remove this photo"
      >
        <v-icon icon="circle" size="2x" />
        <v-icon icon="trash-alt" class="image__icon" />
      </div>
    </span>
    <b-img
      v-if="thumbnail"
      lazy
      :src="paththumb + '?' + cacheBust"
      rounded
      thumbnail
      class="square"
      :class="{ primary }"
      @click="$emit('click')"
    />
    <b-img
      v-else
      lazy
      :src="path + '?' + cacheBust"
      rounded
      @click="$emit('click')"
    />
    <ConfirmModal
      v-if="confirm"
      :title="'Delete this photo?'"
      @confirm="removeConfirmed"
      @hidden="confirm = false"
    />
  </div>
</template>

<script>
import { useImageStore } from '../stores/image'
const ConfirmModal = () =>
  defineAsyncComponent(() => import('./ConfirmModal.vue'))

export default {
  components: { ConfirmModal },
  props: {
    id: {
      type: [Number, String],
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    paththumb: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: Boolean,
      required: false,
      default: true,
    },
    primary: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const imageStore = useImageStore()

    return {
      imageStore,
    }
  },
  data() {
    return {
      cacheBust: Date.now(),
      confirm: false,
    }
  },
  methods: {
    remove() {
      this.confirm = true
    },
    removeConfirmed() {
      this.$emit('remove', this.id)
    },
    async rotate(deg) {
      await this.imageStore.post({
        id: this.id,
        rotate: deg,
        bust: Date.now(),
      })

      this.cacheBust = Date.now()
    },
    rotateLeft() {
      this.rotate(90)
      this.cacheBust = Date.now()
    },
    rotateRight() {
      this.rotate(-90)
      this.cacheBust = Date.now()
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

.image__icon {
  color: $color-white;
  transform: translate(-1.5em, -0.5em);

  &.fa-flip-horizontal {
    transform: translate(-1.5em, -0.5em) scaleX(-1);
  }
}

.square {
  object-fit: cover;
  width: 200px;
  height: 200px;
  max-width: 200px;
  min-width: 200px;
  min-height: 200px;
  max-height: 200px;
}

.primary {
  border-width: 2px;
  border-color: $colour-success;
}
</style>
