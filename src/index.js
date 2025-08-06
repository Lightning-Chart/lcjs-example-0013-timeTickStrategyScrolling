/*
 * LightningChartJS example showcasing the TimeTickStrategy feature with scrolling data and axis.
 */
// Import LightningChartJS
const lcjs = require('@lightningchart/lcjs')

// Import xydata
const xydata = require('@lightningchart/xydata')

// Extract required parts from LightningChartJS.
const { lightningChart, AxisScrollStrategies, AxisTickStrategies, emptyFill, Themes } = lcjs

// Import data-generators from 'xydata'-library.
const { createProgressiveTraceGenerator } = xydata

const chart = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
    .ChartXY({
        theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
    })
    .setTitle('Scrolling TimeTickStrategy example')

const axisX = chart
    .getDefaultAxisX()
    // Enable TimeTickStrategy for X Axis.
    .setTickStrategy(AxisTickStrategies.Time)
    // Configure progressive ScrollStrategy.
    .setScrollStrategy(AxisScrollStrategies.scrolling)
    // Set view to 1 minute.
    .setDefaultInterval((state) => ({ end: state.dataMax, start: (state.dataMax ?? 0) - 1 * 60 * 1000, stopAxisAfter: false }))
    .setAnimationScroll(false)

const axisY = chart.getDefaultAxisY().setAnimationScroll(false)

// Add 3 series for real-time signal monitoring.
const seriesList = new Array(3).fill(0).map((_, iSeries) =>
    chart
        .addLineSeries()
        .setMaxSampleCount(50_000)
        .setName(`Series ${iSeries + 1}`),
)

// Stream live timestamp data into series.

// Application displays timestamps as offset from when application started (starts at 00:00:00).
const timeOrigin = Date.now()

Promise.all(
    seriesList.map((_) =>
        createProgressiveTraceGenerator()
            .setNumberOfPoints(60 * 1000)
            .generate()
            .toPromise(),
    ),
).then((data) => {
    let dataAmount = 0
    const pushData = () => {
        const nDataPoints = 1
        seriesList.forEach((series, iSeries) => {
            const seriesData = data[iSeries]
            const seriesPoints = []
            for (let i = 0; i < nDataPoints; i += 1) {
                seriesPoints.push({
                    // TimeTickStrategy interprets values as milliseconds (UNIX timestamp).
                    // Exactly same as JavaScript Date APIs.
                    x: Date.now() - timeOrigin,
                    y: seriesData[(dataAmount + i) % seriesData.length].y,
                })
            }
            series.appendJSON(seriesPoints)
        })
        dataAmount += nDataPoints
        requestAnimationFrame(pushData)
    }
    pushData()
})
