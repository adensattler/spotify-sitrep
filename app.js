const express = require('express');
const request = require("request");
const fs = require('fs');



const app = express();
const PORT = 3000;
const querystring = require("querystring");

const credentials = fs.readFileSync('./credentials.json', 'utf-8');
const client_id = JSON.parse(credentials).client_id; // Your client id
const client_secret = JSON.parse(credentials).client_secret; // Your secret
const redirect_uri = "http://localhost:3000/callback"; // Your redirect uri

// Set the view engine to EJS
app.set('view engine', 'ejs');
// Serve static files from the 'public' directory
app.use(express.static('static'));

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


app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
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
    console.log("made it to callback! \n");

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



// refresh token code is from the spoitfy website
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