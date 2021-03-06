// Client ID and API key from the Developer Console
var CLIENT_ID = '676098131753-moe956gvg3b76kms29bhjoqufdqid9ki.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDHqXCo6WfXcqRouWwIGTGMMcAI0UV4ljE';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";

var googleButton = document.getElementById('google');

var cardHolder = document.getElementById('movies');
var movies;
var moviesInit;
var ids = [];
var ratings = {};
var columns = {}
var sheetRows = {};

var tmdbBase = 'https://api.themoviedb.org/3/';
var tmdbKey = '09bd1912d223a0bbe8c486692bd70a9d';

var imageBase;
var posterSizes;
var genres;

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    // Handle the initial sign-in state.  
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    googleButton.onclick = handleGoogle;
  }, function (error) {
    console.log(JSON.stringify(error, null, 2));
  });
}

function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    currentUser = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
    img = currentUser.getGivenName() == 'Doga' ? '../../doga.jpeg' : '../../basak.jpeg';
    googleButton.innerHTML = '<img style="border-radius: 50%" src="' + img + '"/>'
    showRatelist();
  } else {
    googleButton.innerHTML = '<i class="fab fa-google"></i>';
  }
}

function handleGoogle() {
  if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
    gapi.auth2.getAuthInstance().signOut();
  } else {
    gapi.auth2.getAuthInstance().signIn();
  }
}

function showRatelist() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1Mc1uBsKIMJP9ouEgEMPhZ3Asr2j9_BORXCorvRMSAGk',
    range: 'Ratings'
  }).then((response) => {
    moviesInit = response.result.values;

    header = moviesInit[0]
    for (i = 0; i < header.length; i++) {
      columns[header[i]] = i;
    }
    movies = moviesInit.slice(1);

    for (i = 0; i < movies.length; i++) {
      sheetRows[movies[i][columns['ID']]] = i+2
    }

    $(document).ready(function () {
      $.ajax({
        type: "GET",
        url: tmdbBase + "configuration?api_key=" + tmdbKey,
        success: function (result) {
          imageBase = result.images.secure_base_url;
          posterSizes = result.images.poster_sizes;

          genres = {};

          $.ajax({
            type: "GET",
            url: tmdbBase + "genre/movie/list?api_key=" + tmdbKey,
            success: function (result) {
              for (i = 0; i < result.genres.length; i++) {
                genres[result.genres[i].id] = result.genres[i].name;
              }
              $('.open-modal').click(toggleModalClasses);
              $('.close-modal').click(toggleModalClasses);
              showMovies();
            },
            error: function (result) {
              console.log(result)
            }
          });
        },
        error: function (result) {
          console.log(result)
        }
      });
    });
  });
}

function showMovies(filter = 'Basak or Doga') {
  for (i = 0; i < movies.length; i++) {
    row = movies[i];
    ids.push(row[columns['ID']]);
    if (filter == 'Basak or Doga' || (filter == 'Basak' && row[columns['Basak Rating']] != '') || (filter == 'Doga' && row[columns['Doga Rating']] != '') || (filter == 'Basak and Doga' && row[columns['Basak Rating']] != '' && row[columns['Doga Rating']] != '')) {
      ratings[row[columns['ID']]] = {
        'Doga': row[columns['Doga Rating']],
        'Basak': row[columns['Basak Rating']]
      }

      if (row[columns['Poster Path']] != "") {
        poster = imageBase + posterSizes[3] + row[columns['Poster Path']];
      } else {
        poster = 'https://spidermanfull.com/wp-content/plugins/fakevideo/includes/templates_files/no-photo.jpg';
      }

      column = document.createElement('div');
      column.id = row[columns['ID']];
      column.classList.add('column', 'is-one-third-mobile', 'is-one-quarter-tablet', 'is-one-fifth-desktop', 'is-2-widescreen');
      column.innerHTML = `<div class="card">
                            <div class="card-image">
                              <figure class="image is-2by3">
                                <a onclick="createModal(${i})"><img src="${poster}"></a>
                              </figure>
                            </div>
                            <div class="card-content">      
                              <nav class="level">
                                <div class="level-left">
                                  <div class="level-item">
                                    <figure class="image is-32x32">
                                      <img class="is-rounded" src="../../doga.jpeg">
                                    </figure>
                                    <div style="padding-left: 5px;">
                                      ${rating(row[columns['Doga Rating']])}
                                    </div>
                                  </div>
                                </div>
                                <div class="level-right">
                                  <div class="level-item">                                
                                    <figure class="image is-32x32">
                                      <img class="is-rounded" src="../../basak.jpeg">
                                    </figure>
                                    <div style="padding-left: 5px;">
                                      ${rating(row[columns['Basak Rating']])}
                                    </div>
                                  </div>
                                </div>
                              </nav>
                            </div>
                          </div>`;
      cardHolder.appendChild(column);
    }
  }
}

function rating(x) {
  if (x == "") {
    x = '??';
  } else if (x.length == 1) {
    x += '.0';
  }
  return x;
}

function filterChanged() {
  filter = document.getElementById('filter').value;
  cardHolder.innerHTML = "";
  showMovies(filter);
}

function reSort() {
  desc = document.getElementById('desc').checked;
  order = document.getElementById('sort').value;
  filter = document.getElementById('filter').value;

  if (desc) {
    if (order == 'Release Date') {
      movies.sort((a, b) => b[columns[order]].localeCompare(a[columns[order]]));
    } else if (order == 'Date Added') {
      movies = moviesInit.slice(1);
      movies.reverse();
    } else if (order == 'Doga + Basak') {
      movies.sort((a, b) => Number(b[columns['Doga Rating']]) + Number(b[columns['Basak Rating']]) - Number(a[columns['Doga Rating']]) - Number(a[columns['Basak Rating']]));
    } else {
      movies.sort((a, b) => b[columns[order]] - a[columns[order]]);
    }
  } else {
    if (order == 'Release Date') {
      movies.sort((a, b) => a[columns[order]].localeCompare(b[columns[order]]));
    } else if (order == 'Date Added') {
      movies = moviesInit.slice(1);
    } else if (order == 'Doga + Basak') {
      movies.sort((a, b) => Number(a[columns['Doga Rating']]) + Number(a[columns['Basak Rating']]) - Number(b[columns['Doga Rating']]) - Number(b[columns['Basak Rating']]));
    } else {
      movies.sort((a, b) => a[columns[order]] - b[columns[order]]);
    }
  }

  cardHolder.innerHTML = "";
  showMovies(filter);
}

function toggleModalClasses(event) {
  var modalId = event.currentTarget.dataset.modalId;
  var modal = $(modalId);
  modal.toggleClass('is-active');
  $('html').toggleClass('is-clipped');
}

function createModal(movieRow) {
  movie = movies[movieRow];
  var modal = $('#my-modal');
  var date, poster;

  if (movie[columns['Release Date']] != "") {
    date = `(${movie[columns['Release Date']].substring(0,4)})`
  } else {
    date = '(????)'
  }

  if (movie[columns['Poster Path']] != "") {
    poster = imageBase + posterSizes[1] + movie[columns['Poster Path']];
  } else {
    poster = 'https://spidermanfull.com/wp-content/plugins/fakevideo/includes/templates_files/no-photo.jpg';
  }

  var overview_elem = document.getElementById('movie-overview')
  var poster_elem = document.getElementById('poster');
  var title = document.getElementById('title');
  var genre_elem = document.getElementById('genre');
  var language_elem = document.getElementById('language');

  title.innerText = `${movie[columns['Title']]} ${date}`
  overview_elem.innerText = movie[columns['Overview']];
  poster_elem.src = poster;

  if (movie[columns['Genres']] == "") {
    genre_elem.innerText = 'Unknown Genre';
  } else {
    genre_elem.innerText = movie[columns['Genres']];
  }

  if (movie.language == "") {
    language_elem.innerText = '??';
  } else {
    language_elem.innerText = movie[columns['Language']].toUpperCase();
  }

  oldDoga = document.getElementById('old-doga');
  if (oldDoga != null) {
    oldDoga.parentNode.removeChild(oldDoga);
  }
  dogaRating = document.createElement('div');
  dogaRating.id = 'old-doga';
  document.getElementById('doga-rating').appendChild(dogaRating);

  oldBasak = document.getElementById('old-basak');
  if (oldBasak != null) {
    oldBasak.parentNode.removeChild(oldBasak);
  }
  basakRating = document.createElement('div');
  basakRating.id = 'old-basak';
  document.getElementById('basak-rating').appendChild(basakRating);

  if (currentUser.getGivenName() == 'Doga') {
    $('#old-doga').starRating({
      starSize: 25,
      initialRating: movie[columns['Doga Rating']],
      callback: function (currentRating, $el) {
        movies[movieRow][columns['Doga Rating']] = '' + currentRating;
        reSort();
        modal.toggleClass('is-active');
        $('html').toggleClass('is-clipped');

        gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: '1Mc1uBsKIMJP9ouEgEMPhZ3Asr2j9_BORXCorvRMSAGk',
          range: `Ratings!I${sheetRows[movie[columns['ID']]]}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [
              ["" + currentRating]
            ]
          }
        }).then((response) => {
          var result = response.result;
          console.log(`${result.updatedCells} cells updated.`);
        });
      }
    })
    $('#old-basak').starRating({
      starSize: 25,
      initialRating: movie[columns['Basak Rating']],
      readOnly: true
    })
  } else {
    $('#old-doga').starRating({
      starSize: 25,
      initialRating: movie[columns['Doga Rating']],
      readOnly: true
    })
    $('#old-basak').starRating({
      starSize: 25,
      initialRating: movie[columns['Basak Rating']],
      callback: function (currentRating, $el) {
        movies[movieRow][columns['Basak Rating']] = '' + currentRating;
        reSort();
        modal.toggleClass('is-active');
        $('html').toggleClass('is-clipped');

        gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: '1Mc1uBsKIMJP9ouEgEMPhZ3Asr2j9_BORXCorvRMSAGk',
          range: `Ratings!J${sheetRows[movie[columns['ID']]]}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [
              ["" + currentRating]
            ]
          }
        }).then((response) => {
          var result = response.result;
          console.log(`${result.updatedCells} cells updated.`);
        });
      }
    })
  }

  modal.toggleClass('is-active');
  $('html').toggleClass('is-clipped');
}