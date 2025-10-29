require('dotenv').config()

const express = require('express')
const app = express()

const utils = require('./utils')

const endpoint = process.env.ENDPOINT || 'http://192.168.130.121:8080'
const port = process.env.PORT || 3000
const renderers = require("./renderers")

app.get('/dotmatrix/:station/:location', (req, res) => {
    utils.getJSON(endpoint + '/v2/departures/station/' + req.params.station.toUpperCase(), (data) => {
        for (const [key, departure] of Object.entries(data.departures)) {
            if (departure.platform_actual === req.params.location) {

                // Fetch arrival data asynchronously
                utils.getJSON(endpoint + '/v2/arrivals/station/' + req.params.station.toUpperCase(), (data) => {
                    let arrival
                    for (const [key, arrivalData] of Object.entries(data.arrivals)) {
                        if(arrivalData.service_id === departure.service_id) {
                            arrival = arrivalData
                            break
                        }
                    }
                    utils.getJSON(endpoint + '/v2/services/service/' + departure.service_number + '/' + departure.service_date, (data) => {
                        let service
                        if(data) {
                            for (const [key, partsData] of Object.entries(data.service.parts)) {
                                for (const [key, stopData] of Object.entries(partsData.stops)) {
                                    if (stopData.station.code === req.params.station.toUpperCase()) {
                                        service = stopData
                                        break
                                    }
                                }
                            }
                        }
                        res.send(renderers.render128x64(departure, arrival, service))

                    })
                })
                break // required to prevent the api from crashing by sending more data than needed
            }
        }
    });
})

app.listen(port, () => {
    console.log(`Kairos Rendering API listening on port ${port}`)
})
