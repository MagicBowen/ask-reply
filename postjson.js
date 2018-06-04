const request = require('request');

module.exports = (uri, data) => {
    return new Promise( (resolve, reject) => { 
        request( { method : 'POST'
                 , uri : uri
                 , multipart: [{'content-type': 'application/json', body: JSON.stringify(data)}]
                 }, (err, res, body) => {
                    if (!err && res.statusCode == 200) {
                        resolve(body.reply);
                      } else {
                        reject(err);
                      }
                 }
            )
        } 
    );
}