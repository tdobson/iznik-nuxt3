<template>
  <div @click="$emit('click')">
    <div v-if="summary">
      <b-img lazy src="/promised.jpg" class="promised__image" />
      <b-popover
        v-model="showing"
        :content="title"
        placement="top"
        variant="primary"
        triggers="hover"
        :target="'msg-' + id"
        custom-class="primary"
        @shown="shown"
        @hidden="hidden"
      />
    </div>
    <div v-else>
      <notice-message v-if="!toMe" variant="warning">
        This item has already been promised to someone. You can still reply, but
        you'll probably only get it if someone else drops out.
      </notice-message>
      <notice-message v-else variant="primary">
        This has been promised to you.
      </notice-message>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    id: {
      type: Number,
      required: true,
    },
    toMe: {
      type: Boolean,
      required: false,
      default: false,
    },
    summary: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data: function () {
    return {
      scrollHandler: null,
      showing: false,
    }
  },
  computed: {
    title() {
      if (!this.toMe) {
        return "This item has already been promised to someone. You can still reply, but you'll probably only get it if someone else drops out."
      } else {
        return 'This has been promised to you.'
      }
    },
  },
  beforeUnmount() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler)
      this.scrollHandler = null
    }
  },
  methods: {
    shown() {
      if (!this.scrollHandler) {
        this.scrollHandler = window.addEventListener(
          'scroll',
          this.handleScroll
        )
      }
    },
    hidden() {
      if (this.scrollHandler) {
        window.removeEventListener('scroll', this.scrollHandler)
        this.scrollHandler = null
      }
    },
    handleScroll() {
      this.showing = false
    },
  },
}
</script>
<style scoped lang="scss">
.promised__image {
  position: absolute;
  width: 225px;
  z-index: 2;
  transform: rotate(15deg);
  top: 30%;

  // Centre the absolute positioned div in its container
  left: 50%;
  margin-left: -125px;
}
</style>
