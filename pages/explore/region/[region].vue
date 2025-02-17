<template>
  <client-only>
    <b-row class="m-0">
      <b-col cols="12" lg="6" class="p-0" offset-lg="3">
        <h1 class="visually-hidden">Freegling map in {{ region }}</h1>
        <PostMapAndList
          v-if="initialBounds"
          :initial-bounds="initialBounds"
          start-on-groups
          :initial-group-ids="initialGroupIds"
          :region="region"
          class="mt-2"
          show-start-message
        />
        <b-alert v-else variant="danger" :model-value="true">
          That region isn't valid.
        </b-alert>
      </b-col>
    </b-row>
  </client-only>
</template>
<script>
import { useRoute } from 'vue-router'
import { defineAsyncComponent } from 'vue'
import { buildHead } from '../../../composables/useBuildHead'
import { useGroupStore } from '~/stores/group'

export default {
  components: {
    PostMapAndList: defineAsyncComponent(() =>
      import('~/components/PostMapAndList')
    ),
  },
  async setup(props) {
    const runtimeConfig = useRuntimeConfig()
    const route = useRoute()
    const region = route.params.region
      ? route.params.region.trim().toLowerCase()
      : null

    useHead(
      buildHead(
        route,
        runtimeConfig,
        'Explore Freegle communities' +
          (route.params.region ? ' in ' + route.params.region : ''),
        null,
        {
          class: 'overflow-y-scroll',
        }
      )
    )

    // Get all the groups in store for the adaptive map.
    const groupStore = useGroupStore()
    await groupStore.fetch()

    // Calculate the initial bounds for the region.
    let bounds = null
    const groupids = []
    const allGroups = groupStore.list

    let swlat = null
    let swlng = null
    let nelat = null
    let nelng = null

    for (const ix in allGroups) {
      const group = allGroups[ix]
      // console.log('compare', group.region, params.region)

      if (
        group.onmap &&
        group.publish &&
        group.region &&
        group.region.trim().toLowerCase() === region
      ) {
        swlat = swlat === null ? group.lat : Math.min(swlat, group.lat)
        swlng = swlng === null ? group.lng : Math.min(swlng, group.lng)
        nelat = nelat === null ? group.lat : Math.max(nelat, group.lat)
        nelng = nelng === null ? group.lng : Math.max(nelng, group.lng)
        groupids.push(group.id)
      }
    }

    if (swlat !== null && swlng !== null && nelat !== null && nelng !== null) {
      bounds = [
        [swlat, swlng],
        [nelat, nelng],
      ]
    }

    return {
      region,
      initialBounds: bounds,
      initialGroupIds: groupids,
    }
  },
}
</script>
