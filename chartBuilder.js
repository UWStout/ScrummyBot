import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import * as d3 from 'd3-time'

import * as UTIL from './commands/util.js'

class ChartBuilder {
  constructor (width = 800, height = 600) {
    // Customize the global ChartJS and any plugins
    const chartCallback = (ChartJS) => {
      // Set border thickness for all rectangle elements (bars)
      ChartJS.defaults.global.elements.rectangle.borderWidth = 2

      // Fill background
      ChartJS.plugins.register({
        beforeDraw: (chart, options) => {
          const ctx = chart.ctx
          ctx.save()
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
          ctx.restore()
        }
      })
    }

    // Setup a date formatter
    this.dateFormatter = Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })

    // Get a ChartJSNodeCanvas instance
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback })
  }

  reBinTimeCardData (rangeStart, rangeEnd, data) {
    // Add 1 day to the end so that day is included in the buckets
    const localEnd = new Date(rangeEnd)
    localEnd.setDate(localEnd.getDate() + 1)

    // Build the bins for this range
    const binnedData = {}
    const days = d3.timeDay.range(rangeStart, localEnd)
    days.forEach((curDay) => { binnedData[curDay] = 0 })

    // Go through each clock period and put hours worked into day bins
    for (let i = 0; i < data.length - 1; i++) {
      // Skip over an 'out' to the next 'in'
      if (data[i].punch === 'out') continue

      // Get clock in and out times
      const clockIn = data[i].time
      const clockOut = data[i + 1].time

      // Find and initialize the bin if needed
      const dayBin = d3.timeDay(clockIn)
      if (!binnedData[dayBin]) { binnedData[dayBin] = 0 }

      // Add time to bin (in minutes)
      binnedData[dayBin] += UTIL.minutesBetween(clockIn, clockOut)
    }

    return binnedData
  }

  makeUserHoursChart (userName, rangeStart, rangeEnd, data) {
    const binData = this.reBinTimeCardData(rangeStart, rangeEnd, data)

    // Build the chart using the chart.js/Image-Chart API
    const chartConfig = {
      type: 'bar',
      data: {
        labels: Object.keys(binData).map((label) => { return this.dateFormatter.format(new Date(label)) }),
        datasets: [
          {
            borderColor: 'rgb(255,+99,+132)',
            backgroundColor: 'rgb(255,+99,+132)',
            data: Object.values(binData)
          }
        ]
      },
      options: {
        legend: { display: false },
        title: {
          display: true,
          text: [
            `Hours Worked for ${userName}`,
            `${this.dateFormatter.format(rangeStart)} to ${this.dateFormatter.format(rangeEnd)}`
          ]
        },
        scales: {
          xAxes: [{ scaleLabel: { display: true, labelString: 'Day' } }],
          yAxes: [{ scaleLabel: { display: true, labelString: 'Minutes' } }]
        }
      }
    }

    // Setup image properties and return Promise that resolves to data buffer
    return this.chartJSNodeCanvas.renderToBuffer(chartConfig, 'image/jpeg')
  }
}

export default ChartBuilder
