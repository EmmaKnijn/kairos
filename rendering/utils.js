    const http = require('http');

    // source: https://stackoverflow.com/questions/9577611/how-to-make-an-http-get-request-in-node-js-express

    /**
     * getJSON:  RESTful GET request returning JSON object(s)
     * @param path: the endpoint to call
     * @param callback: callback to pass the results JSON object(s) back
     */

    module.exports.getJSON = (path, onResult) => {
      http.get(path, resp => {
            let data = ''
            resp.on('data', chunk => {
                data += chunk
            })
            resp.on('end', () => {
                data = JSON.parse(data)
                onResult(data)
            })
        })
    };