require('dotenv').config()

const express = require('express')
const app = express()

const utils = require('./utils')

const endpoint = process.env.ENDPOINT || 'http://192.168.130.121:8080'
const port = process.env.PORT || 3000
app.get('/dotmatrix/:station/:location', (req, res) => {
    const options = {
        path: endpoint + '/v2/departures/station/' + req.params.station.toUpperCase(),
    };
    res.setHeaderValue
    utils.getJSON(options, (data) => {
        for (const [key, departure] of Object.entries(data.departures)) {
            if (departure.platform_actual === req.params.location) {
                console.log(departure)
                res.send(departure)
                break
            }
        }
    });

    //res.send('ERR')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
