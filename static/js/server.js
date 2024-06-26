
// Get the inner HTML content of the element with ID 'user-profile-template'
var userProfileSource = document.getElementById("user-profile-template").innerHTML,
    // Compile the HTML content into a Handlebars template function
    userProfileTemplate = Handlebars.compile(userProfileSource),    
    
    // Get the element with the ID 'sitrep' and store it in a variable
    // This element will be used as a placeholder to insert the rendered template
    userProfilePlaceholder = document.getElementById("sitrep");

 var displayName = "SITREP";

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
                $("#login").hide();
                $("#loggedin").show();
                processSitrep();    // IMPORTANT: load the default report on successful login!
            },
            error: function (xhr, status, error) {
                console.error("Error making base Spotify API call:", error);
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

function retrieveTracks(timePeriod, callback) {
    $.ajax({
        url: `https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=${timePeriod}`,
        headers: {
            Authorization: "Bearer " + access_token,
        },
        success: function (response) {
            let data = {
                trackList: response.items,
                total: 0,
                date: today.toLocaleDateString("en-US", dateOptions).toUpperCase(),
                json: true,
            };
            for (var i = 0; i < data.trackList.length; i++) {
                // Reformat the track name
                data.trackList[i].name = data.trackList[i].name.toUpperCase() + " - "; 
            
                // Each track holds its rank to display
                data.trackList[i].id = (i + 1 < 10 ? "0" : "") + (i + 1); 
            
                // Correct the property name for external URLs
                data.trackList[i].url = data.trackList[i].external_urls?.spotify;
            
                // Update the formatting for all artists on a track
                let formattedArtists = "";
                for (var j = 0; j < data.trackList[i].artists.length; j++) {
                    let tmp = data.trackList[i].artists[j].name.trim().toUpperCase();
                    
                    // Add a comma if this is not the last artist
                    if (j != data.trackList[i].artists.length - 1) {
                        tmp += ", ";
                    }
                    formattedArtists += tmp;
                }
                data.trackList[i].artists = formattedArtists;
            }

            // userProfilePlaceholder.innerHTML = userProfileTemplate({
            // Update the template with the values for the tracks and misc
            let tracksListHTML = userProfileTemplate({
                tracks: data.trackList,
                total: data.total,
                time: data.date,
                num: TIME_RANGE_OPTIONS[timePeriod].num,
                name: displayName,
                period: TIME_RANGE_OPTIONS[timePeriod].period,
            });
            // Call the callback with the extracted content
            callback(tracksListHTML);
        },
        error: function (xhr, status, error) {
            console.error("Error making tracks API call:", error);
            // Call the callback with an error if needed
            callback(null, error);
        },
    });
}

function retrieveArtists(timePeriod, callback) {
    $.ajax({
        url: `https://api.spotify.com/v1/me/top/artists?limit=10&time_range=${timePeriod}`,
        headers: {
            Authorization: "Bearer " + access_token,
        },
        success: function (response) {
            let data = {
                artistList: response.items,
                json: true,
            };
            for (var i = 0; i < data.artistList.length; i++) {
                data.artistList[i].name = data.artistList[i].name.toUpperCase(); // Reformat the artist name!
                data.artistList[i].id = (i + 1 < 10 ? "0" : "") + (i + 1); // Each artist holds its rank to display
            }

            // Create a new template with ONLY the values for the artists
            let artistListHTML = userProfileTemplate({
                artists: data.artistList
            });

            // Then extract the content of #artistListContainer from that new template (since it is the only data that will be populated)
            let artistContainerContent = $(artistListHTML).find("#artistListContainer").html();

            // Call the callback with the extracted content 
            callback(artistContainerContent);
        },
        error: function (xhr, status, error) {
            console.error("Error making artists API call:", error);
            // Call the callback with an error if needed
            callback(null, error);
        },
    });
}

// Generates a sitrep and displays it to the user
function processSitrep() {
    const timeRange = getPeriod();      // determine what time range selection the user made

    // RETRIEVE TRACK DATA for the appropriate time range
    retrieveTracks(timeRange, function (trackListContent, trackError) {
        // Handle error if needed
        if (trackError) {
            console.error("Error retrieving tracks:", trackError);
            return;
        }
        // Update the HTML content to display the template and tracks info!
        userProfilePlaceholder.innerHTML = trackListContent

        // After tracks are loaded, RETRIEVE ARTIST DATA
        retrieveArtists(timeRange, function (artistListContent, artistError) {
            // Handle error if needed
            if (artistError) {
                console.error("Error retrieving artists:", artistError);
                return;
            }

            // Append or update the HTML content for artists
            $("#artistListContainer").html(artistListContent);
        });
        generateIncidentID();
    });
}

function generateIncidentID() {
    // Function to generate a random number within a specified range
    function generateRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Generate a random number with 8 digits
    const randomIncidentNumber = generateRandomNumber(10000000, 99999999);

    // Update the incident number in the HTML
    const incidentNumberElement = document.getElementById('incident-number');
    incidentNumberElement.textContent = randomIncidentNumber;
};