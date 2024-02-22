/*
 * LightningChartJS example showcasing the TimeTickStrategy feature with scrolling data and axis.
 */
// Import LightningChartJS
const lcjs = require('@arction/lcjs')

// Import xydata
const xydata = require('@arction/xydata')

// Extract required parts from LightningChartJS.
const { lightningChart, AxisScrollStrategies, AxisTickStrategies, Themes } = lcjs

// Import data-generators from 'xydata'-library.
const { createProgressiveTraceGenerator } = xydata

const chart = lightningChart()
    .ChartXY({
        // theme: Themes.darkGold
    })
    .setTitle('Scrolling TimeTickStrategy example')
    .setPadding({ right: 40 })

const axisX = chart
    .getDefaultAxisX()
    // Enable TimeTickStrategy for X Axis.
    .setTickStrategy(AxisTickStrategies.Time)
    // Configure progressive ScrollStrategy.
    .setScrollStrategy(AxisScrollStrategies.progressive)
    // Set view to 1 minute.
    .setDefaultInterval((state) => ({ end: state.dataMax, start: (state.dataMax ?? 0) - 1 * 60 * 1000, stopAxisAfter: false }))
    .setAnimationScroll(false)

const axisY = chart.getDefaultAxisY().setAnimationScroll(false)

// Add 3 series for real-time signal monitoring.
const seriesList = new Array(3).fill(0).map((_, iSeries) =>
    chart.addLineSeries({
        dataPattern: {
            pattern: 'ProgressiveX',
        },
    }),
)

const legend = chart
    .addLegendBox()
    .add(chart)
    // Dispose example UI elements automatically if they take too much space. This is to avoid bad UI on mobile / etc. devices.
    .setAutoDispose({
        type: 'max-width',
        maxWidth: 0.3,
    })

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
            series.add(seriesPoints)
        })
        dataAmount += nDataPoints
        requestAnimationFrame(pushData)
    }
    pushData()
})
