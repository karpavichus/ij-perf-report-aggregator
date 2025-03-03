import { LineChart, ScatterChart } from "echarts/charts"
import { DatasetComponent, GridComponent, LegendComponent, ToolboxComponent, TooltipComponent } from "echarts/components"
import { registerTransform, use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { CallbackDataParams } from "echarts/types/src/util/types"
import * as ecStat from "echarts-stat"
import { debounceTime } from "rxjs"
import { Ref } from "vue"
import { refToObservable } from "../../configurators/rxjs"
import { DataQueryExecutor, DataQueryResult } from "../common/DataQueryExecutor"
import { adaptToolTipFormatter, timeFormat } from "../common/chart"
import { DataQueryExecutorConfiguration } from "../common/dataQuery"
import { LineChartOptions } from "../common/echarts"
import { InfoSidebar } from "../common/sideBar/InfoSidebar"
import { getInfoDataForStartup, InfoDataFromStartup } from "../common/sideBar/InfoSidebarStartup"
import { ChartManager } from "./ChartManager"
import { ChartToolTipManager } from "./ChartToolTipManager"

const dataZoomConfig = [
  // https://echarts.apache.org/en/option.html#dataZoom-inside
  // type inside means that mouse maybe used to zoom.
  { type: "inside" },
  {},
]

use([DatasetComponent, ToolboxComponent, TooltipComponent, GridComponent, LineChart, ScatterChart, LegendComponent, CanvasRenderer])

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
registerTransform(ecStat.transform.regression)
export type PopupTrigger = "item" | "axis" | "none"
export class LineChartManager {
  private readonly chart: ChartManager

  constructor(
    container: HTMLElement,
    private _dataQueryExecutor: DataQueryExecutor,
    dataZoom: Ref<boolean>,
    sidebarEnabled: Ref<boolean>,
    chartToolTipManager: ChartToolTipManager,
    chartSidebarManager: InfoSidebar<InfoDataFromStartup> | undefined,
    trigger: PopupTrigger = "axis",
    resizeContainer: HTMLElement | undefined
  ) {
    this.chart = new ChartManager(container, resizeContainer ?? document.body)

    // https://github.com/apache/echarts/issues/2941
    let lastParams: CallbackDataParams[] | null = null
    this.chart.chart.getZr().on("click", (event) => {
      if (chartSidebarManager != null && sidebarEnabled.value) {
        const infoDataForStartup = getInfoDataForStartup(lastParams)
        if (infoDataForStartup) {
          chartSidebarManager.show(infoDataForStartup)
        }
      } else {
        chartToolTipManager.showTooltip(lastParams, event.event)
      }
    })

    this.chart.chart.setOption<LineChartOptions>(
      {
        legend: {
          top: 0,
          left: 0,
          itemHeight: 3,
          itemWidth: 15,
          icon: "rect",
          type: "scroll",
        },
        animation: false,
        toolbox: {
          top: 20,
          feature: {
            dataZoom: {
              yAxisIndex: false,
            },
            saveAsImage: {},
          },
        },
        tooltip: {
          show: true,
          trigger,
          enterable: true,
          // select text in tooltip
          extraCssText: "user-select: text",
          axisPointer: {
            type: "cross",
            snap: true,
          },
          formatter: adaptToolTipFormatter((params) => {
            lastParams = params
            return null
          }),
        },
        xAxis: {
          type: "time",
          axisPointer: {
            snap: true,
            label: {
              formatter(data) {
                return timeFormat.format(data.value as number)
              },
            },
          },
        },
        yAxis: {
          type: "value",
          axisPointer: {
            snap: true,
          },
        },
        dataZoom: dataZoom.value ? dataZoomConfig : undefined,
      },
      {
        replaceMerge: ["legend"],
      }
    )

    this.chart.chart.dispatchAction({
      type: "takeGlobalCursor",
      key: "dataZoomSelect",
      dataZoomSelectActive: true,
    })
    this.subscribe()
    refToObservable(dataZoom)
      .pipe(debounceTime(100))
      .subscribe((value) => {
        this.chart.chart.setOption({
          dataZoom: value ? dataZoomConfig : undefined,
        })
      })
  }

  subscribe(): () => void {
    return this._dataQueryExecutor.subscribe((data: DataQueryResult | null, configuration: DataQueryExecutorConfiguration, isLoading) => {
      if (isLoading || data == null) {
        this.chart.chart.showLoading("default", { showSpinner: false })
        return
      }
      this.chart.chart.hideLoading()
      this.chart.updateChart(configuration.chartConfigurator.configureChart(data, configuration))
    })
  }

  dispose(): void {
    this.chart.dispose()
  }
}
