const express = require('express'); // Express web server framework
const request = require('request');
const cors = require('cors');

const app = express();
const PORT = 3000;
const querystring = require("querystring");

// pulling in env vars
require('dotenv').config();
const client_id = process.env.client_id;// Your spotify dev client id
const client_secret = process.env.client_secret; // Your dev secret
var redirect_uri = process.env.redirect_uri || 'http://localhost:3000/callback'; // Your redirect uri


app
    .set('view engine', 'ejs')  // Set the view engine to EJS
    .use(cors())
    .use(express.static('static')); // Serve static files from the 'static' directory


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated stringh
 */
var generateRandomString = function (length) {
    var text = "";
    var possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// Run on env var port for production (8080) or 3000 for development
const port = process.env.PORT || 8080;
app.listen(port, function () {
    console.log(`Server is running on http://localhost:${port}`);
});

app.get("/", (req, res) => {
    res.render('index.ejs');
});

app.get("/login", function (req, res) {
    //res.cookie(stateKey, state);
    var state = generateRandomString(16);
    var scope = "user-read-private user-read-email user-top-read";

    // your application requests authorization
    res.redirect(
        "https://accounts.spotify.com/authorize?" +
        querystring.stringify({
            response_type: "code",
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state,
        })
    );
});

// directly from documentation https://developer.spotify.com/documentation/web-api/tutorials/code-flow
app.get("/callback", function (req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter
    //console.log("made it to callback! \n");

    var code = req.query.code || null;
    var state = req.query.state || null;
    // var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null) {
        res.redirect(
            "/#" +
            querystring.stringify({
                error: "state_mismatch",
            })
        );
    } else {
        // res.clearCookie(stateKey);
        var authOptions = {
            url: "https://accounts.spotify.com/api/token",
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: "authorization_code",
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            json: true,
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                // we can pass the token to the browser to make requests from there
                res.redirect(
                    "/#" +
                    querystring.stringify({
                        client: "spotify",
                        access_token: access_token,
                        refresh_token: refresh_token,
                    })
                );
            } else {
                res.send("There was an error during authentication.");
            }
        });
    }
});



// refresh token code is from the spotify website
// app.get('/refresh_token', function (req, res) {
//     var refresh_token = req.query.refresh_token;
//     var authOptions = {
//         url: 'https://accounts.spotify.com/api/token',
//         headers: {
//             'content-type': 'application/x-www-form-urlencoded',
//             'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
//         },
//         form: {
//             grant_type: 'refresh_token',
//             refresh_token: refresh_token
//         },
//         json: true
//     };

//     request.post(authOptions, function (error, response, body) {
//         if (!error && response.statusCode === 200) {
//             var access_token = body.access_token,
//                 refresh_token = body.refresh_token;
//             res.send({
//                 'access_token': access_token,
//                 'refresh_token': refresh_token
//             });
//         }
//     });
// });