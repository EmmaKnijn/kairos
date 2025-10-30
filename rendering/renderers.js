const font = require('./fonts/main-font')
const tinyFont = require('./fonts/tiny-font')
const symbolFont = require("./fonts/symbol-font");

const utils = require('./utils')
const colors = require('./colors')

module.exports.render128x64 = (departure, arrival, service) => {
    let pixels = utils.clearScreen(128,64)

    let signPhase = utils.getPhase()
    let timeData = utils.getTimeData(departure, arrival)

    const textColor = colors.white

    let shownTime
    let minuteDelay = 0
    let statusMessage = ""
    let statusColor = colors.black

    if (arrival && !utils.isAtStation(departure,arrival)) {
        minuteDelay = timeData.arrivalDelay
        shownTime = timeData.arrivalTime
    } else {
        minuteDelay = timeData.departureDelay
        shownTime = timeData.departureTime
    }

    const timeUntilEvent = Math.floor((shownTime - timeData.currentTime) / 1000 / 60)

    if (utils.isAtStation(departure,arrival)) {
        statusMessage = ""
        statusColor = colors.green
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
        statusColor = colors.orange
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

    if (!departure.cancelled) {
        utils.drawText(pixels, parsedDelay, 1, 2, colors.red, font);
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
    //utils.drawText(pixels, timeString, 128 - timeStringOffset, 2, textColor, tinyFont);
    //utils.drawText(pixels, destinationline1, 1, 13, textColor, font);
    //utils.drawText(pixels, destinationline2, 1, 23, textColor, font);
    //utils.drawText(pixels, vialine1, 1, 23 + viaOffset, textColor, tinyFont);
    //utils.drawText(pixels, vialine2, 1, 29 + viaOffset, textColor, tinyFont);
    for (let x = 0; x <= 128; x++) {
        pixels[64][x] = statusColor
    }
    utils.drawText(pixels, statusMessage, 1, 56, statusColor, font);
    //const offset = departure.platform_actual.length * font.width + departure.platform_actual.length * 2
    //utils.drawText(pixels, departure.platform_actual, 127 - offset, 56, textColor, font);


    if(service) {
        let trainSetStartPoint = 0
        let trainString = ''
        let trainTypeString = ''
        let offset
        let busynessString = ' '
        let materialIndex = 0
        for (const [key, material] of Object.entries(service.material)) {
            materialIndex = materialIndex + 1
            const length = utils.getTrainLength(material.type)
            trainString += utils.trainStringLUT[length]
            //console.log(trainString.length / 2 - material.type.length)
            trainTypeString += material.type.padStart(trainString.length / 2 - material.type.length," ").padEnd(trainString.length / 2 - material.type.length," ")
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

        utils.drawText(pixels,busynessString,64 - offset,20,textColor,symbolFont)
        utils.drawText(pixels,trainString,64 - offset,18,textColor,symbolFont)
        utils.drawText(pixels,trainTypeString,64 - offset,12,textColor,tinyFont)
    }

    return pixels
}