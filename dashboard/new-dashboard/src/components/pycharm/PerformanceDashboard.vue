<template>
  <DashboardPage
    v-slot="{ averagesConfigurators }"
    db-name="perfint"
    table="pycharm"
    persistent-id="pycharm_dashboard"
    initial-machine="linux-blade-hetzner"
  >
    <section class="flex gap-6">
      <div class="w-1/2">
        <AggregationChart
          :configurators="averagesConfigurators"
          :aggregated-measure="'processingSpeed#Python'"
          :title="'Indexing Python (kB/s)'"
          :chart-color="'#219653'"
          :value-unit="'counter'"
        />
      </div>
    </section>
    <section>
      <GroupProjectsChart
        label="Indexing"
        :measure="['indexing', 'indexingTimeWithoutPauses']"
        :projects="['django/indexing', 'empty_project/indexing', 'flusk/indexing', 'matplotlib/indexing', 'pandas/indexing']"
      />
    </section>
    <section>
      <GroupProjectsChart
        label="Number Of Indexed Files"
        measure="numberOfIndexedFiles"
        :projects="['django/indexing', 'empty_project/indexing', 'flask/indexing', 'matplotlib/indexing', 'pandas/indexing']"
      />
    </section>
    <section>
      <GroupProjectsChart
        label="Inspection execution time"
        measure="globalInspections"
        :projects="['django/inspection', 'flask/inspection', 'matplotlib/inspection', 'pandas/inspection']"
      />
    </section>
  </DashboardPage>
</template>

<script setup lang="ts">
import AggregationChart from "../charts/AggregationChart.vue"
import GroupProjectsChart from "../charts/GroupProjectsChart.vue"
import DashboardPage from "../common/DashboardPage.vue"
</script>
