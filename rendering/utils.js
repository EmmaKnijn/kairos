const http = require('http');
const https = require('https');

// source: https://stackoverflow.com/questions/9577611/how-to-make-an-http-get-request-in-node-js-express
/**
 * getJSON:  RESTful GET request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */

module.exports.getJSON = (options, onResult) => {
  console.log(options.path)

  http.get(options.path, resp => {
        let data = ''
        resp.on('data', chunk => {
            data += chunk
        })
        resp.on('end', () => {
            data = JSON.parse(data)
            onResult(data)
        })
    })
    return {}
};