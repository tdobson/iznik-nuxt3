<template>
  <l-marker :lat-lng="latLng">
    <l-icon>
      <div class="thick wide bg-white text-center rounded pt-1 speech-bubble">
        <h3>
          {{ text }}
        </h3>
      </div>
    </l-icon>
  </l-marker>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      required: true,
    },
    latLng: {
      type: Array,
      required: true,
    },
  },
}
</script>

<style scoped lang="scss">
@import 'bootstrap/scss/functions';
@import 'bootstrap/scss/variables';
@import 'bootstrap/scss/mixins/_breakpoints';

.thick {
  border: 2px solid $color-green--darker !important;
}

.wide {
  position: relative;
  width: 200px;
  left: -95px;
  top: -55px;
}

.speech-bubble:before {
  content: '';
  width: 0px;
  height: 0px;
  position: absolute;
  border-left: 10px solid transparent;
  border-right: 10px solid $color-green--darker;
  border-top: 10px solid $color-green--darker;
  border-bottom: 10px solid transparent;
  left: 130px;
  bottom: -20px;
  border-bottom-right-radius: 20px;
}

.speech-bubble:after {
  content: '';
  width: 0px;
  height: 0px;
  position: absolute;
  border-left: 8px solid transparent;
  border-right: 6px solid $color-white;
  border-top: 8px solid $color-white;
  border-bottom: 8px solid transparent;
  left: 134px;
  bottom: -14px;
  border-bottom-right-radius: 15px;
}

.speech-bubble {
  animation-duration: 1s;
  animation-iteration-count: 1;

  animation-name: fadein-animation;
  animation-timing-function: ease;
}

@keyframes fadein-animation {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
