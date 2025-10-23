require('dotenv').config()

const express = require('express')
const app = express()

const utils = require('./utils')

const endpoint = process.env.ENDPOINT || 'http://192.168.130.121:8080'
const port = process.env.PORT || 3000
const load = require("load-bmfont");
const tinyFont = require("./tiny-font");
const symbolFont = require('./symbol-font');
const font = require("./font");

app.get('/dotmatrix/:station/:location', (req, res) => {

    let pixels = {}
    for (let y = 1;y <= 64; y++) {
        pixels[y] = {}
        for (let x = 0; x <= 128; x++) {
            pixels[y][x] = {r: 0, g: 0, b: 0}
        }
    }

    utils.getJSON(endpoint + '/v2/departures/station/' + req.params.station.toUpperCase(), (data) => {
        for (const [key, departure] of Object.entries(data.departures)) {
            if (departure.platform_actual === req.params.location) {
                const renderDisplay = (departure, arrival, service) => {

                    const font = require('./font')
                    const tinyFont = require('./tiny-font')

                    let signPhase = utils.getPhase()
                    let timeData = utils.getTimeData(departure, arrival)

                    const textColor = { r: 255, g: 255, b: 255 }; // Black color
                    const redColor = { r: 255, g: 0, b: 0 }; // Red color
                    const greenColor = { r: 0, g: 255, b: 0 }; // Green color
                    const orangeColor = { r: 255, g: 165, b: 0 }; // Orange color
                    const blackColor = {r: 0, g: 0, b: 0}; // Black color
                    let shownTime
                    let minuteDelay = 0


                    if (arrival && !utils.isAtStation(departure,arrival)) {
                        minuteDelay = timeData.arrivalDelay
                        shownTime = timeData.arrivalTime
                    } else {
                        minuteDelay = timeData.departureDelay
                        shownTime = timeData.departureTime
                    }
                    let statusMessage = ""
                    let statusColor = blackColor
                    const timeUntilEvent = Math.floor((shownTime - timeData.currentTime) / 1000 / 60)
                    if (utils.isAtStation(departure,arrival)) {
                        statusMessage = ""
                        statusColor = greenColor
                    }
                    let parsedDelay = ""
                    let parsedTime = ""
                    let timeOffset = 0
                    if (minuteDelay > 0 && (signPhase === 1 || signPhase === 3)) {
                        parsedDelay = "+" + minuteDelay
                        timeOffset = 30
                    }

                    if (timeUntilEvent + minuteDelay < 1) {
                        statusMessage = "Trein vertrekt"
                        statusColor = orangeColor
                    }
                    if (signPhase === 1 || signPhase === 3) {
                        parsedTime = shownTime.getHours() + ":" + String(shownTime.getMinutes()).padStart(2, '0')
                    } else if (signPhase === 2 || signPhase === 4) {
                        if (timeUntilEvent + minuteDelay === 1) {
                            parsedTime = timeUntilEvent + minuteDelay + " minuut"
                        } else if (timeUntilEvent + minuteDelay < 1) {
                            parsedTime = "<1 minuut"

                        } else {
                            parsedTime = timeUntilEvent + minuteDelay + " minuten"
                        }
                    }

                    if (departure.cancelled) {
                        utils.drawText(pixels,"Train does not depart", 1, 2, redColor, font);
                    } else {
                        utils.drawText(pixels, parsedDelay, 1, 2, redColor, font);
                        utils.drawText(pixels, parsedTime, 1 + timeOffset, 2, textColor, font);
                    }
                    let destinationText = departure.destination_actual
                    if (departure.via) {
                        destinationText = departure.destination_actual + " via";
                    }

                    const maxWidth = 128;
                    const destinationWords = destinationText.split(' ');
                    let destinationline1 = '';
                    let destinationline2 = '';
                    let currentLine = 1
                    let viaOffset = 0
                    for (const word of destinationWords) {
                        if (currentLine === 1) {
                            if ((word.length * font.width + word.length * 2 + destinationline1.length * font.width + destinationline1.length * 2) > maxWidth) {
                                currentLine++;
                                destinationline2 += word + ' ';
                            } else {
                                destinationline1 += word + ' ';
                            }

                        } else {
                            destinationline2 += word + ' ';
                            viaOffset = 10
                        }
                    }

                    if (destinationline2 === "via ") {
                        destinationline2 = ""
                    }

                    let vialine1 = '';
                    let vialine2 = '';

                    if (departure.via) {
                        const viaWords = departure.via.split(' ');
                        currentLine = 1
                        for (const word of viaWords) {
                            if (currentLine === 1) {
                                if (word.length * tinyFont.width + word.length * 2 + vialine1.length * tinyFont.width + vialine1.length * 2 > maxWidth) {
                                    currentLine++;
                                    vialine2 += word + ' ';
                                } else {
                                    vialine1 += word + ' ';
                                }

                            } else {
                                vialine2 += word + ' ';
                            }
                        }
                    }

                    let timeString = timeData.currentTime.getHours() + ":" + String(timeData.currentTime.getMinutes()).padStart(2, '0')
                    let timeStringOffset = timeString.length * tinyFont.width + timeString.length * 2
                    utils.drawText(pixels, timeString, 128 - timeStringOffset, 2, textColor, tinyFont);
                    utils.drawText(pixels, destinationline1, 1, 13, textColor, font);
                    utils.drawText(pixels, destinationline2, 1, 23, textColor, font);
                    utils.drawText(pixels, vialine1, 1, 23 + viaOffset, textColor, tinyFont);
                    utils.drawText(pixels, vialine2, 1, 29 + viaOffset, textColor, tinyFont);
                    for (let x = 0; x <= 128; x++) {
                        pixels[64][x] = statusColor
                    }
                    utils.drawText(pixels, statusMessage, 1, 56, statusColor, font);
                    const offset = departure.platform_actual.length * font.width + departure.platform_actual.length * 2
                    utils.drawText(pixels, departure.platform_actual, 127 - offset, 56, textColor, font);


                    if(service) {
                        let trainSetStartPoint = 0
                        let trainString = ''
                        let offset
                        let busynessString = ' '
                        let materialIndex = 0
                        for (const [key, material] of Object.entries(service.material)) {
                            materialIndex = materialIndex + 1
                            const length = utils.getTrainLength(material.type)
                            if (length === 6) {
                                trainString += 'ABDBDBDBDBDBC'
                            } else if (length === 4) {
                                trainString += 'ABDBDBDBC'
                            } else if (length === 3) {
                                trainString += 'ABDBDBC'
                            } else if (length === 5) {
                                trainString += 'ABDBDBDBDBC'
                            } else if (length === 2) {
                                trainString += 'ABDBC'
                            }
                            offset = trainString.length * symbolFont.width / 2

                            const busyness = utils.getBusyness(material.type)

                            let characters = 2 + length + length - 1
                            if (materialIndex == 1) {
                                trainSetStartPoint = 64 - offset
                            } else {
                                trainSetStartPoint = trainSetStartPoint + characters * symbolFont.width
                            }
                            for(const [key, busynessAmount] of Object.entries(busyness)) {
                                if(busynessAmount == 1) {
                                    busynessString += 'E '
                                } else if(busynessAmount == 2) {
                                    busynessString += 'F '
                                } else if(busynessAmount == 3) {
                                    busynessString += 'G '
                                } else {
                                    busynessString += 'E '
                                }
                            }
                            busynessString += ' '
                        }
                        utils.drawText(pixels,busynessString,64 - offset,48,textColor,symbolFont)

                        utils.drawText(pixels,trainString,64 - offset,46,textColor,symbolFont)
                    }

                    res.send(pixels)

                }

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
                        renderDisplay(departure, arrival, service)
                    })
                })
                
                break
            }
        }
    });
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
