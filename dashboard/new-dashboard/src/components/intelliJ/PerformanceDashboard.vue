<template>
  <DashboardPage
    v-slot="{ averagesConfigurators }"
    db-name="perfint"
    table="idea"
    persistent-id="idea_dashboard"
    initial-machine="Linux EC2 C6id.8xlarge (32 vCPU Xeon, 64 GB)"
    :charts="charts"
  >
    <section class="flex gap-6">
      <div class="flex-1 min-w-0">
        <AggregationChart
          :configurators="averagesConfigurators"
          :aggregated-measure="'completion\_%'"
          :is-like="true"
          :title="'Completion'"
        />
      </div>
      <div class="flex-1 min-w-0">
        <AggregationChart
          :configurators="[...averagesConfigurators, typingOnlyConfigurator]"
          :aggregated-measure="'test#average_awt_delay'"
          :title="'UI responsiveness during typing'"
          :chart-color="'#F2994A'"
        />
      </div>
    </section>
    <section>
      <GroupProjectsChart
        v-for="chart in charts"
        :key="chart.definition.label"
        :label="chart.definition.label"
        :measure="chart.definition.measure"
        :projects="chart.projects"
      />
    </section>
  </DashboardPage>
</template>

<script setup lang="ts">
import AggregationChart from "../charts/AggregationChart.vue"
import { ChartDefinition, combineCharts } from "../charts/DashboardCharts"
import GroupProjectsChart from "../charts/GroupProjectsChart.vue"
import DashboardPage from "../common/DashboardPage.vue"
import { DataQuery, DataQueryExecutorConfiguration } from "../common/dataQuery"

const chartsDeclaration: ChartDefinition[] = [
  {
    labels: ["VFS Refresh"],
    measures: ["vfs_initial_refresh"],
    projects: ["intellij_sources/vfsRefresh/default", "intellij_sources/vfsRefresh/with-1-thread(s)", "intellij_sources/vfsRefresh/git-status"],
  },
  {
    labels: ["Rebuild (Big projects)"],
    measures: ["build_compilation_duration"],
    projects: ["community/rebuild", "intellij_sources/rebuild"],
  },
  {
    labels: ["Rebuild"],
    measures: ["build_compilation_duration"],
    projects: ["grails/rebuild", "java/rebuild", "spring_boot/rebuild"],
  },
  {
    labels: ["Inspection"],
    measures: ["globalInspections"],
    projects: ["java/inspection", "grails/inspection", "spring_boot_maven/inspection", "spring_boot/inspection", "kotlin/inspection", "kotlin_coroutines/inspection"],
  },
  {
    labels: ["FindUsages PsiManager#getInstance Before and After Compilation", "Lookups number", "Lookups duration"],
    measures: ["findUsages", "lookups", "lookupsDurationMs"],
    projects: ["community/findUsages/PsiManager_getInstance_Before", "community/findUsages/PsiManager_getInstance_After"],
  },
  {
    labels: ["FindUsages Library#getName (all usages)", "FindUsages Library#getName (first usage)"],
    measures: [
      ["findUsages", "fus_find_usages_all"],
      ["findUsages_firstUsage", "fus_find_usages_first"],
    ],
    projects: ["community/findUsages/Library_getName_Before", "community/findUsages/Library_getName_After"],
  },
  {
    labels: ["FindUsages LocalInspectionTool#getID Before and After Compilation"],
    measures: ["findUsages"],
    projects: ["community/findUsages/LocalInspectionTool_getID_Before", "community/findUsages/LocalInspectionTool_getID_After"],
  },
  {
    labels: ["FindUsages ActionsKt#runReadAction and Application#runReadAction Before and After Compilation"],
    measures: ["findUsages"],
    projects: [
      "community/findUsages/ActionsKt_runReadAction_Before",
      "community/findUsages/ActionsKt_runReadAction_After",
      "community/findUsages/Application_runReadAction_Before",
      "community/findUsages/Application_runReadAction_After",
    ],
  },
  {
    labels: ["FindUsages Persistent#absolutePath and PropertyMapping#value Before and After Compilation"],
    measures: ["findUsages"],
    projects: [
      "community/findUsages/Persistent_absolutePath_Before",
      "community/findUsages/Persistent_absolutePath_After",
      "community/findUsages/PropertyMapping_value_Before",
      "community/findUsages/PropertyMapping_value_After",
    ],
  },
  {
    labels: ["FindUsages Object#hashCode and Path#toString Before and After Compilation"],
    measures: ["findUsages"],
    projects: [
      "community/findUsages/Object_hashCode_Before",
      "community/findUsages/Object_hashCode_After",
      "community/findUsages/Path_toString_Before",
      "community/findUsages/Path_toString_After",
    ],
  },
  {
    labels: ["FindUsages Objects#hashCode Before and After Compilation", "FindUsages Objects#hashCode Before and After Compilation (first usage)"],
    measures: [
      ["findUsages", "fus_find_usages_all"],
      ["findUsages_firstUsage", "fus_find_usages_first"],
    ],
    projects: ["community/findUsages/Objects_hashCode_Before", "community/findUsages/Objects_hashCode_After"],
  },
  {
    labels: ["FindUsages Path#div Before and After Compilation"],
    measures: ["findUsages"],
    projects: ["community/findUsages/Path_div_Before", "community/findUsages/Path_div_After"],
  },
  {
    labels: ["Find Usages with idea.is.internal=true Before Compilation"],
    measures: ["findUsages"],
    projects: [
      "intellij_sources/findUsages/PsiManager_getInstance_firstCall",
      "intellij_sources/findUsages/PsiManager_getInstance_secondCall",
      "intellij_sources/findUsages/PsiManager_getInstance_thirdCallInternalMode",
    ],
  },
  {
    labels: ["Local Inspection", "First Code Analysis"],
    measures: ["localInspections", "firstCodeAnalysis"],
    projects: ["intellij_sources/localInspection/java_file", "intellij_sources/localInspection/kotlin_file", "kotlin/localInspection", "kotlin_coroutines/localInspection"],
  },
  {
    labels: ["Completion"],
    measures: ["completion"],
    projects: ["community/completion/kotlin_file", "grails/completion/groovy_file", "grails/completion/java_file"],
  },
  {
    labels: ["Debug run configuration", "Debug step into"],
    measures: ["debugRunConfiguration", "debugStep_into"],
    projects: ["debug-kotlin_petclinic/debug"],
  },
  {
    labels: ["Search Everywhere", "Search Everywhere (Dialog Shown)", "Search Everywhere (Items Loaded)"],
    measures: ["searchEverywhere", "searchEverywhere_dialog_shown", "searchEverywhere_items_loaded"],
    projects: [
      "community/go-to-action/SharedIndex",
      "community/go-to-class/EditorImpl",
      "community/go-to-class/SharedIndex",
      "community/go-to-file/EditorImpl",
      "community/go-to-file/SharedIndex",
    ],
  },
  {
    labels: ["Search Everywhere Slow Typing", "Search Everywhere Slow Typing (Dialog Shown)", "Search Everywhere Slow Typing (Items Loaded)"],
    measures: ["searchEverywhere", "searchEverywhere_dialog_shown", "searchEverywhere_items_loaded"],
    projects: ["community/go-to-action/Runtime", "community/go-to-class/Kotlin", "community/go-to-file/properties"],
  },
  {
    labels: ["Show Intentions (average awt delay)", "Show Intentions (showQuickFixes)", "Show Intentions (awt dispatch time)"],
    measures: ["test#average_awt_delay", "showQuickFixes", "AWTEventQueue.dispatchTimeTotal"],
    projects: ["grails/showIntentions/Find cause", "kotlin/showIntention/Import", "spring_boot/showIntentions"],
  },
  {
    labels: ["Show File History"],
    measures: ["showFileHistory"],
    projects: ["intellij_sources/showFileHistory/EditorImpl"],
  },
  {
    labels: ["Expand Project Menu"],
    measures: ["%expandProjectMenu"],
    projects: ["intellij_sources/expandProjectMenu"],
  },
  {
    labels: ["Expand Main Menu"],
    measures: ["%expandMainMenu"],
    projects: ["intellij_sources/expandMainMenu"],
  },
  {
    labels: ["Expand Editor Menu"],
    measures: ["%expandEditorMenu"],
    projects: ["intellij_sources/expandEditorMenu"],
  },
  {
    labels: ["Highlight"],
    measures: ["highlighting"],
    projects: ["kotlin/highlight", "kotlin_coroutines/highlight"],
  },
  {
    labels: ["FileStructure"],
    measures: ["FileStructurePopup"],
    projects: ["intellij_sources/FileStructureDialog/java_file", "intellij_sources/FileStructureDialog/kotlin_file"],
  },
  {
    labels: ["Creating a new file"],
    measures: [["createJavaFile", "createKotlinFile"]],
    projects: ["intellij_sources/createJavaClass", "intellij_sources/createKotlinClass"],
  },
  {
    labels: ["Typing during indexing (average awt delay)", "Typing during indexing (max awt delay)"],
    measures: ["test#average_awt_delay", "test#max_awt_delay"],
    projects: ["typingInJavaFile_16Threads/typing", "typingInJavaFile_4Threads/typing", "typingInKotlinFile_16Threads/typing", "typingInKotlinFile_4Threads/typing"],
  },
]

const charts = combineCharts(chartsDeclaration)

const typingOnlyConfigurator = {
  configureQuery(query: DataQuery, _configuration: DataQueryExecutorConfiguration): boolean {
    query.addFilter({ f: "project", v: "%typing", o: "like" })
    return true
  },
  createObservable() {
    return null
  },
}
</script>
