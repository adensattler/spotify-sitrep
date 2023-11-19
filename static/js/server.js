(function () {

    var displayName = "SITREP";
    var today = new Date(); // get today's data to display later!!
    var dateOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    }; // enumerate the date options you want to display so it looks nice!


    var userProfileSource = document.getElementById(
        "user-profile-template"
    ).innerHTML,
        userProfileTemplate = Handlebars.compile(userProfileSource),
        userProfilePlaceholder = document.getElementById("sitrep");


    // get and set vars needed for API call
    let params = getHashParams();
    let access_token = params.access_token,
        client = params.client,
        error = params.error;

    // make a call to the user endpoint to get their name, ensure API functionality, and hide the login screen
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

        // add event listeners on the time period buttons so they update data on click!
        document.getElementById("short_term").addEventListener(
            "click",
            function () {
                retrieveTracks("short_term", 1, "LAST MONTH", function (trackListContent, trackError) {
                    // Handle error if needed
                    if (trackError) {
                        console.error("Error retrieving tracks:", trackError);
                        return;
                    }
            
                    // Update the HTML content to display the template and tracks info!
                    userProfilePlaceholder.innerHTML = trackListContent
            
                    // After tracks are loaded, retrieve artists
                    retrieveArtists("short_term", function (artistListContent, artistError) {
                        // Handle error if needed
                        if (artistError) {
                            console.error("Error retrieving artists:", artistError);
                            return;
                        }
            
                        // Append or update the HTML content for artists
                        $("#artistListContainer").html(artistListContent);
                    });
                });
            },
            false
        );
        document.getElementById("medium_term").addEventListener(
            "click",
            function () {
                retrieveTracks("medium_term", 2, "LAST 6 MONTHS", function (trackListContent, trackError) {
                    // Handle error if needed
                    if (trackError) {
                        console.error("Error retrieving tracks:", trackError);
                        return;
                    }
                    // Update the HTML content to display the template and tracks info!
                    userProfilePlaceholder.innerHTML = trackListContent
            
                    // After tracks are loaded, retrieve artists
                    retrieveArtists("medium_term", function (artistListContent, artistError) {
                        // Handle error if needed
                        if (artistError) {
                            console.error("Error retrieving artists:", artistError);
                            return;
                        }
            
                        // Append or update the HTML content for artists
                        $("#artistListContainer").html(artistListContent);
                    });
                });
            },
            false
        );
        document.getElementById("long_term").addEventListener(
            "click",
            function () {
                retrieveTracks("long_term", 3, "ALL TIME", function (trackListContent, trackError) {
                    // Handle error if needed
                    if (trackError) {
                        console.error("Error retrieving tracks:", trackError);
                        return;
                    }
            
                    // Update the HTML content to display the template and tracks info!
                    userProfilePlaceholder.innerHTML = trackListContent
            
                    // After tracks are loaded, retrieve artists
                    retrieveArtists("long_term", function (artistListContent, artistError) {
                        // Handle error if needed
                        if (artistError) {
                            console.error("Error retrieving artists:", artistError);
                            return;
                        }
            
                        // Append or update the HTML content for artists
                        $("#artistListContainer").html(artistListContent);
                    });
                });
            },
            false
        );
    }


    // FUNCTIONS
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

    /**
     * Obtains parameters from the hash of the URL
     * @return Object
     */
    function retrieveTracks(timePeriod, domNumber, domPeriod, callback) {
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
                    data.trackList[i].name = data.trackList[i].name.toUpperCase() + " - "; // Reformat the track name!
                    data.trackList[i].id = (i + 1 < 10 ? "0" : "") + (i + 1); // Each track holds its rank to display

                    // Update the formatting for all artists on a track!
                    for (var j = 0; j < data.trackList[i].artists.length; j++) {
                        data.trackList[i].artists[j].name =
                            data.trackList[i].artists[j].name.trim().toUpperCase();

                        if (j != data.trackList[i].artists.length - 1) {
                            data.trackList[i].artists[j].name =
                                data.trackList[i].artists[j].name + ", ";
                        }
                    }
                }

                // userProfilePlaceholder.innerHTML = userProfileTemplate({
                // Update the template with the values for the tracks and misc
                let tracksListHTML = userProfileTemplate({
                    tracks: data.trackList,
                    total: data.total,
                    time: data.date,
                    num: domNumber,
                    name: displayName,
                    period: domPeriod,
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

                // Update the template with the values for the artists
                let artistListHTML = userProfileTemplate({
                    artists: data.artistList
                });

                // Extract only the content of #artistListContainer from that new template
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





})();