<template>
  <div>
    <div
      v-for="(date, idx) in current"
      :key="date.uniqueid"
      :class="date.string && date.string.past ? 'inpast' : ''"
    >
      <StartEndDate
        v-model="current[idx]"
        :removable="!required || current.length > 1"
        :max-duration-days="maxDurationDays"
        :time="time"
        @remove="remove(date)"
      />
    </div>
    <b-button variant="secondary" class="mt-2" @click="add">
      <v-icon icon="plus" /> Add <span v-if="current.length > 0">another</span
      ><span v-else>a</span> date
    </b-button>
  </div>
</template>
<script>
import { uid } from '../composables/useId'
import { ref } from '#imports'
import StartEndDate from '~/components/StartEndDate'

export default {
  components: {
    StartEndDate,
  },
  props: {
    modelValue: {
      type: Array,
      required: true,
    },
    required: {
      type: Boolean,
      required: false,
      default: false,
    },
    maxDurationDays: {
      type: Number,
      required: false,
      default: null,
    },
    time: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const current = ref(props.modelValue)

    if (props.modelValue?.length === 0 && props.required) {
      current.value = [
        {
          uniqueid: uid('date-'),
          start: null,
          end: null,
          past: false,
        },
      ]
    }

    return {
      current,
    }
  },
  watch: {
    current(newVal) {
      console.log('Current coll', newVal)
      this.$emit('update:modelValue', newVal)
    },
  },
  methods: {
    remove(item) {
      const idx = this.current.indexOf(item)
      if (idx !== -1) this.current.splice(idx, 1)
    },
    add() {
      this.current.push({
        uniqueid: uid('date-'),
        start: null,
        end: null,
        starttime: null,
        endtime: null,
        past: false,
      })
    },
  },
}
</script>
<style scoped lang="scss">
.inpast {
  text-decoration: line-through;
  color: $color-gray--faded;
}
</style>
