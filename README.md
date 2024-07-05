# SITREP
SITREP is a web application that gives users insights into their listening history (a situation report) to keep you updated in between your annual Spotify Wrapped.

Live at [sitrep.adenaws.com](https://sitrep.adenaws.com/).

## Getting Started
SITREP is a Node.js app so you will need to have node and npm installed to run the app. You can follow a guide like [this](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) to do so!

Then just clone this repo:
```
git clone https://github.com/adensattler/spotify-sitrep.git
```

## Getting Spotify Credentials
In order to run your own Spotify app (this or any other), you need to have a developer account and create an app through the [developer dashboard](https://developer.spotify.com/dashboard) to get your own credentials.

Once your app is created, you will need to register two Redirect URIs. I use port 3000 when developing locally so I used the following:
- http://localhost:3000
- http://localhost:3000/callback

## Running the App
Make sure you set your environmental variables in a .env file (or in your production environment). These are the variables I used:
- client_id=""
- client_secret=""
- redirect_uri="dev redirect url /callback"
- PORT="3000"

Then run the app:

    $ node app.js

Open `http://localhost:3000` in a browser and you should be good to go!
