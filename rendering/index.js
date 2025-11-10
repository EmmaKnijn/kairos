require('dotenv').config()

const express = require('express')
const app = express()

const utils = require('./utils')
const renderers = require("./renderers")

const endpoint = process.env.ENDPOINT || 'http://localhost:8080'
const port = process.env.PORT || 3000

app.get('/dotmatrix/:station/:location', (req, res) => {
    utils.getJSON(endpoint + '/v2/departures/station/' + req.params.station.toUpperCase(), (data) => {
        const departure = utils.getDeparture(data,req.params.location)

        utils.getJSON(endpoint + '/v2/arrivals/station/' + req.params.station.toUpperCase(), (data) => {
            let arrival = utils.getArrival(data,departure)

            utils.getJSON(endpoint + '/v2/services/service/' + departure.service_number + '/' + departure.service_date, (data) => {
                let service = utils.getService(data,req.params.station)

                res.send(renderers.render128x64(departure, arrival, service)) // render the pixels for a 128x64 display and send it to the client

            })
        })
    });
})

app.listen(port, () => {
    console.log(`Kairos Rendering API listening on port ${port}`)
})
