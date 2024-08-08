
// Get the inner HTML content of the element with ID 'user-profile-template'
var userProfileSource = document.getElementById("user-profile-template").innerHTML,
    // Compile the HTML content into a Handlebars template function
    userProfileTemplate = Handlebars.compile(userProfileSource),

    // Get the element with the ID 'sitrep' and store it in a variable
    // This element will be used as a placeholder to insert the rendered template
    userProfilePlaceholder = document.getElementById("sitrep");

var displayName = "";   // variable placeholder for client username. will be updated upon login!

var today = new Date(); // get today's data to display later!!
var dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
}; // enumerate the date options you want to display so it looks nice!

const EVENT_LISTENERS = [
    'short_term',
    'medium_term',
    'long_term'
];

const TIME_RANGE_OPTIONS = {
    short_term: {
        num: 1,
        period: 'LAST MONTH',
    },
    medium_term: {
        num: 2,
        period: 'LAST 6 MONTHS',
    },
    long_term: {
        num: 3,
        period: 'ALL TIME',
    },
};

const SPOTIFY_ROOT_URL = "https://api.spotify.com/v1"

// Get the current selected period (time range)
const getPeriod = () => {
    return (
        document.querySelector('input[name="period-select"]:checked')?.value ?? 'short_term'
        // if no value is check for some reason, default to short_term period
    );
};

// get and set vars needed for API call
let params = getHashParams();
let access_token = params.access_token,
    client = params.client,
    error = params.error;



// PRIMARY LOGIN DRIVER!!!
// ---------------------------------------------------------------------------------------------
// make a call to the user endpoint to get user's name, ensure API functionality, and hide the login screen
if (error) {
    alert("There was an error during the authentication");
} else {
    if (client === "spotify" && access_token) {
        $.ajax({
            url: "https://api.spotify.com/v1/me",
            headers: {
                Authorization: "Bearer " + access_token,
            },
            success: function (response) {
                displayName = response.display_name.toUpperCase();
                $("#login").hide();
                $("#loggedin").show();
                processSitrep();    // IMPORTANT: load the default report on successful login!
            },
            error: function (xhr, status, error) {
                console.error("Error making base Spotify API call:", error);
                $("#login").show();
                $("#loggedin").hide();
                // THIS HAPPENS WHEN THE PAGE TIMES OUT
                // Maybe use the callback here to refresh token?
            },
        });
    }
    else {
        // render initial screen
        $("#login").show();
        $("#loggedin").hide();
    }

    // Add event listeners to each selector that retrieves the appropriate data on click!!
    EVENT_LISTENERS.forEach((id) =>
        document.getElementById(id).addEventListener('click', processSitrep, false)
    );
}


// FUNCTIONS
// ---------------------------------------------------------------------------------------------
/**
* Obtains parameters from the hash of the URL
* @return Object
*/
function getHashParams() {
    var hashParams = {};
    var e,
        r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ((e = r.exec(q))) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}

function retrieveTracks(timePeriod) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=${timePeriod}`,
            headers: {
                Authorization: "Bearer " + access_token,
            },
            success: function (response) {
                let formattedTracks = response.items.map((item, index) => {
                    let formattedArtists = item.artists.map(artist => artist.name.trim().toUpperCase()).join(", ");
                    return {
                        name: item.name.toUpperCase() + " - ",
                        id: (index + 1 < 10 ? "0" : "") + (index + 1),   // Each track holds its rank to display
                        url: item.external_urls.spotify,
                        artists: formattedArtists
                    }
                })

                // Call the callback with the extracted content
                resolve(formattedTracks);
            },
            error: function (xhr, status, error) {
                console.error("Error making tracks API call:", error);
                reject(error);
            },
        });
    });
}

function retrieveArtists(timePeriod) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `https://api.spotify.com/v1/me/top/artists?limit=10&time_range=${timePeriod}`,
            headers: {
                Authorization: "Bearer " + access_token,
            },
            success: function (response) {
                // Generate JSON of artist details by mapping over the items in the API response!
                let formattedArtists = response.items.map((item, index) => {
                    return {
                        name: item.name.toUpperCase(),
                        id: (index + 1 < 10 ? "0" : "") + (index + 1),
                        url: item.external_urls.spotify,
                    }
                })

                resolve(formattedArtists);
            },
            error: function (xhr, status, error) {
                console.error("Error making artists API call:", error);
                reject(error);
            },
        });
    });
}

function retrieveGenres(timePeriod){
    return new Promise((resolve, reject) =>{
        $.ajax({
            url: `https://api.spotify.com/v1/me/top/artists?limit=49&time_range=${timePeriod}`,
            headers: {
                Authorization: "Bearer " + access_token,
            },
            success: function (response){
                let genreDict = {};
                let totalGenres = 0;
                
                // make a counter of all genres in the top 50 artists
                response.items.forEach( (artist) => {
                    artist.genres.forEach( (genre) => {
                        if (!genreDict[genre]) {
                            genreDict[genre] = 0;
                        }
                        genreDict[genre] += 1;
                        totalGenres += 1;
                    });
                });

                let formattedGenres = Object
                    .entries(genreDict) // create Array of Arrays with [genre, count]
                    .sort((a, b) => b[1] - a[1]) // sort by genre count, descending (b-a)
                    .slice(0,10) // return only the first 10 elements of the intermediate result
                    .map(([genre]) => {
                        return {
                            genre: genre,
                            percentage: ((genreDict[genre] / response.items.length) *100).toFixed(2) + "%",
                        }
                    });


                resolve(formattedGenres)
            },
            
            error: function (xhr, status, error) {
                console.error("Error making artists API call:", error);
                reject(error);
            },
        });
    });
}

// Generates a sitrep and displays it to the user
async function processSitrep() {
    const timeRange = getPeriod();      // determine what time range selection the user made

    // Retrieve track data
    const trackListContent = await retrieveTracks(timeRange);

    // Retrieve artist data
    const artistListContent = await retrieveArtists(timeRange);

    // Retrieve genre data
    const genreListContent = await retrieveGenres(timeRange);

    // Update the template with display it 
    userProfilePlaceholder.innerHTML = userProfileTemplate({
        num: TIME_RANGE_OPTIONS[timeRange].num,
        name: displayName,
        incident_num: generateIncidentID(),
        time: today.toLocaleDateString("en-US", dateOptions).toUpperCase(),
        period: TIME_RANGE_OPTIONS[timeRange].period,
        tracks: trackListContent,
        artists: artistListContent,
        genres: genreListContent,
    });
}

function generateIncidentID() {
    // Function to generate a random number within a specified range
    function generateRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Generate a random number with 8 digits
    return generateRandomNumber(10000000, 99999999);
};