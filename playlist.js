let userId = "";
let selectedPlaylistId = "";

function getAccessTokenFromURL() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get("access_token");
}

const token = getAccessTokenFromURL();
async function getUserProfile() {
  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    const data = await response.json();
    userId = data.id;
    if (data) {
      console.log(data);
    } else {
      console.log("No hi ha usuari");
    }
    loadPlaylists();
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
  }
}

async function loadPlaylists() {
  try {
    const url = `https://api.spotify.com/v1/users/${userId}/playlists`;
    //La variable user_id l'obtenim de l'endpoint Get Current User's Profile

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    const data = await response.json();
    console.log(data);
    renderPlaylists(data.items);
  } catch (error) {
    console.error("Error al cargar las playlists:", error);
  }
}

function renderPlaylists(playlists) {
  const container = document.getElementById("playlist-container");
  container.innerHTML = "";

  playlists.forEach((playlist) => {
    const element = document.createElement("div");
    element.classList.add("track");
    element.textContent = playlist.name;
    element.addEventListener("click", () => selectPlaylist(playlist.id));
    container.appendChild(element);
  });
}

async function selectPlaylist(playlistId) {
  selectedPlaylistId = playlistId;
  loadPlaylistTracks(playlistId);
}

async function loadPlaylistTracks(playlistId) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    const data = await response.json();
    renderTracks(data.items);
  } catch (error) {
    console.error("Error al cargar canciones:", error);
  }
}

function renderTracks(tracks) {
  const container = document.getElementById("tracks-container");
  container.innerHTML = "";

  tracks.forEach((track) => {
    const element = document.createElement("div");
    element.classList.add("track");
    element.innerHTML = `
            <img src="${track.track.album.images[0].url}" alt="Album cover">
            <div>
                <h2>${track.track.name}</h2>
                <h3>${track.track.artists[0].name}</h3>
            </div>
            <button onclick="addToSelected('${track.track.uri}', '${track.track.name}', '${track.track.artists[0].name}')">ADD</button>
        `;
    container.appendChild(element);
  });
}

function addToSelected(trackUri, trackName, artistName) {
  const container = document.getElementById("saved-tracks-container");
  const element = document.createElement("div");
  element.classList.add("track");
  element.innerHTML = `
        ${trackName} - ${artistName}
        <button class="delButton" onclick="deleteTrack('${trackUri}', this)">❌</button>
    `;
  container.appendChild(element);
}

async function deleteTrack(trackUri, element) {
  if (confirm("Estàs segur que vols eliminar la cançó de la playlist?")) {
    try {
      await fetch(
        `https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tracks: [{ uri: trackUri }] }),
        }
      );

      element.parentElement.remove();
    } catch (error) {
      console.error("Error al eliminar la canción:", error);
    }
  }
}
getUserProfile();
