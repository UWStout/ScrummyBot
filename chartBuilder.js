import { ChartJSNodeCanvas } from 'chartjs-node-canvas'

import * as d3 from 'd3-time'
import * as UTIL from './commands/util.js'

import Debug from 'debug'
const debug = Debug('bot:chartBuilder')

class ChartBuilder {
  constructor (width = 1000, height = 600) {
    // Customize the global ChartJS and any plugins
    const chartCallback = (ChartJS) => {
      // Set border thickness for all rectangle elements (bars)
      ChartJS.defaults.elements.bar.borderWidth = 2

      // // Fill background
      // ChartJS.plugins.register({
      //   beforeDraw: (chart, options) => {
      //     const ctx = chart.ctx
      //     ctx.save()
      //     ctx.fillStyle = '#ffffff'
      //     ctx.fillRect(0, 0, width, height)
      //     ctx.restore()
      //   }
      // })
    }

    // Setup a date formatter
    this.dateFormatter = Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })

    // Get a ChartJSNodeCanvas instance
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: '#ffffff', chartCallback })
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

  reBinServerTimeCardData (rangeStart, rangeEnd, data) {
    // Add 1 day to the end so that day is included in the buckets
    const localEnd = new Date(rangeEnd)
    localEnd.setDate(localEnd.getDate() + 1)

    // Build the bins for this range
    const bins = {}
    const days = d3.timeDay.range(rangeStart, localEnd)
    days.forEach((curDay) => { bins[curDay] = 0 })

    // Go through each clock period and put hours worked into day bins
    const binnedDataSeries = {}
    for (let i = 0; i < data.length - 1; i++) {
      // Skip over an 'out' to the next 'in'
      if (data[i].punch === 'out') continue

      // Get clock in and out times
      const clockIn = data[i].time
      const clockOut = data[i + 1].time

      // Find and initialize the user if needed
      if (!binnedDataSeries[data[i].discordName]) {
        binnedDataSeries[data[i].discordName] = { ...bins }
      }
      const curUserBins = binnedDataSeries[data[i].discordName]

      // Find an initialize the bin if needed
      const dayBin = d3.timeDay(clockIn)
      if (!curUserBins[dayBin]) { curUserBins[dayBin] = 0 }

      // Add time to bin (in minutes)
      curUserBins[dayBin] += UTIL.minutesBetween(clockIn, clockOut)
    }

    return binnedDataSeries
  }

  makeUserHoursChart (userName, rangeStart, rangeEnd, data) {
    const binData = this.reBinTimeCardData(rangeStart, rangeEnd, data)
    debug(binData)

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
          xAxis: { title: { display: true, text: 'Day' } },
          yAxis: { title: { display: true, text: 'Minutes' } }
        }
      }
    }

    // Setup image properties and return Promise that resolves to data buffer
    debug(2)
    const promise = this.chartJSNodeCanvas.renderToBuffer(chartConfig, 'image/jpeg')
    promise.then(buffer => { debug('Buffer received') }).catch(err => { debug('Chart Error', err) })
    return promise
  }

  makeServerHoursChart (serverName, rangeStart, rangeEnd, data) {
    const binSeriesData = this.reBinServerTimeCardData(rangeStart, rangeEnd, data)

    // Build the chart using the chart.js/Image-Chart API
    const chartConfig = {
      type: 'bar',
      data: {
        labels: Object.keys(Object.values(binSeriesData)[0]).map((label) => {
          return this.dateFormatter.format(new Date(label))
        }),
        datasets: Object.entries(binSeriesData).map(([seriesName, binData], i) => {
          return {
            label: seriesName,
            borderColor: ChartBuilder.BACKGROUND_COLORS[i % ChartBuilder.BACKGROUND_COLORS.length],
            backgroundColor: ChartBuilder.BORDER_COLORS[i % ChartBuilder.BORDER_COLORS.length],
            data: Object.values(binData)
          }
        })
      },
      options: {
        legend: {
          position: 'right',
          align: 'start'
        },
        title: {
          display: true,
          text: [
            `Hours Worked for users in the '${serverName}' server`,
            `${this.dateFormatter.format(rangeStart)} to ${this.dateFormatter.format(rangeEnd)}`
          ]
        },
        scales: {
          scales: {
            x: { title: { display: true, text: 'Day' } },
            y: { title: { display: true, text: 'Minutes' } }
          }
        }
      }
    }

    // Setup image properties and return Promise that resolves to data buffer
    return this.chartJSNodeCanvas.renderToBuffer(chartConfig, 'image/jpeg')
  }
}

// Some nice default colors
ChartBuilder.BACKGROUND_COLORS = [
  'rgba(230,  25,  75, 0.2)',
  'rgba( 60, 180,  75, 0.2)',
  'rgba(255, 225,  25, 0.2)',
  'rgba(  0, 130, 200, 0.2)',
  'rgba(245, 130,  48, 0.2)',
  'rgba(145,  30, 180, 0.2)',
  'rgba( 70, 240, 240, 0.2)',
  'rgba(240,  50, 230, 0.2)',
  'rgba(210, 245,  60, 0.2)',
  'rgba(250, 190, 212, 0.2)',
  'rgba(  0, 128, 128, 0.2)',
  'rgba(220, 190, 255, 0.2)',
  'rgba(170, 110,  40, 0.2)',
  'rgba(255, 250, 200, 0.2)',
  'rgba(128,   0,   0, 0.2)',
  'rgba(170, 255, 195, 0.2)',
  'rgba(128, 128,   0, 0.2)',
  'rgba(255, 215, 180, 0.2)',
  'rgba(  0,   0, 128, 0.2)',
  'rgba(128, 128, 128, 0.2)'
]

ChartBuilder.BORDER_COLORS = [
  'rgba(230,  25,  75, 1)',
  'rgba( 60, 180,  75, 1)',
  'rgba(255, 225,  25, 1)',
  'rgba(  0, 130, 200, 1)',
  'rgba(245, 130,  48, 1)',
  'rgba(145,  30, 180, 1)',
  'rgba( 70, 240, 240, 1)',
  'rgba(240,  50, 230, 1)',
  'rgba(210, 245,  60, 1)',
  'rgba(250, 190, 212, 1)',
  'rgba(  0, 128, 128, 1)',
  'rgba(220, 190, 255, 1)',
  'rgba(170, 110,  40, 1)',
  'rgba(255, 250, 200, 1)',
  'rgba(128,   0,   0, 1)',
  'rgba(170, 255, 195, 1)',
  'rgba(128, 128,   0, 1)',
  'rgba(255, 215, 180, 1)',
  'rgba(  0,   0, 128, 1)',
  'rgba(128, 128, 128, 1)'
]

export default ChartBuilder
