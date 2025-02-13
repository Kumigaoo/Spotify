let userId = "";
let selectedPlaylistId = "";
let selectedPlaylistName = "";

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
    element.addEventListener("click", () =>
      selectPlaylist(playlist.id, playlist.name)
    );
    container.appendChild(element);
  });
}

async function selectPlaylist(playlistId, playlistName) {
  selectedPlaylistId = playlistId;
  selectedPlaylistName = playlistName;
  loadPlaylistTracks(playlistId);
  loadPlaylistName(selectedPlaylistName);
  // Mostra el nom actual de la playlist en l'input
  function loadPlaylistName(name) {
    playlistNameInput.value = name;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const playlistNameInput = document.getElementById("playlistNameInput");
  const updateButton = document.getElementById("updatePlaylistButton");

  // Modificar el nom de la playlist a Spotify
  async function updatePlaylistName() {
    const newName = playlistNameInput.value.trim();

    if (!newName) {
      alert("El nom de la playlist no pot estar buit!");
      return;
    }

    if (confirm("Estàs segur que vols modificar el nom de la playlist?")) {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${selectedPlaylistId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: newName }),
          }
        );

        if (response.ok) {
          alert("Nom de la playlist modificat correctament!");
          loadPlaylists();
        } else {
          alert("Error en modificar el nom de la playlist.");
        }
      } catch (error) {
        console.error("Error al modificar el nom:", error);
        alert("S'ha produït un error.");
      }
    }
  }

  // Event Listener per modificar el nom
  updateButton.addEventListener("click", updatePlaylistName);
});

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
      <button class="add-button">ADD</button>
      <button class="remove-button">REMOVE</button>
    `;
    container.appendChild(element);

    // Add event listener to the button
    const addButton = element.querySelector(".add-button");
    addButton.addEventListener("click", () => {
      addToSelected(
        track.track.uri,
        track.track.name,
        track.track.artists[0].name
      );
    });
    const deleteBut = element.querySelector(".remove-button");
    deleteBut.addEventListener("click", async () => {
      await removeTrack(
        track.track.uri,
        track.track.name,
        track.track.artists[0].name,
        element
      );
    });
  });
}
async function removeTrack(trackUri, trackName, artistName, element) {
  try {
    await fetch(
      `https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks`,
      {
        method: "DELETE", // Use POST to add tracks
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tracks: [{ uri: trackUri }] }), // Correct body format
      }
    );
    if (element) {
      element.remove();
    }
  } catch (error) {
    console.error("Error al quitar la cançó:", error);
  }
}

function addToSelected(trackUri, trackName, artistName) {
  let savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];

  // Avoid duplicate entries
  if (!savedSongs.some((song) => song.trackUri === trackUri)) {
    savedSongs.push({ trackUri, trackName, artistName });
    localStorage.setItem("savedSongs", JSON.stringify(savedSongs));
  }
  renderSavedTracks();
}

function renderSavedTracks() {
  const container = document.getElementById("saved-tracks-container");
  container.innerHTML = ""; // Limpiar el contenido existente

  let savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
  console.log(savedSongs);

  savedSongs.forEach(({ trackUri, trackName, artistName }) => {
    const element = document.createElement("div");
    element.classList.add("savedSongs");
    element.innerHTML = `
      ${trackName} - ${artistName}
      <button class="PAddButton">✔️</button>
      <button class="delButton">❌</button>
    `;
    container.appendChild(element);

    // Agregar el evento al botón de eliminar
    const deleteButton = element.querySelector(".delButton");
    deleteButton.addEventListener("click", function (event) {
      event.stopPropagation(); // Evitar la propagación del evento
      deleteTrack(trackUri, element);
    });
    const addButton = element.querySelector(".PAddButton");
    addButton.addEventListener("click", function (event) {
      event.stopPropagation(); // Evitar la propagación del evento
      addTrackPlaylist(trackUri, element);
    });
  });
}
async function addTrackPlaylist(trackUri, element) {
  if (confirm("Estàs segur que vols afegir la cançó a la playlist?")) {
    let savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];

    try {
      await fetch(
        `https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks`,
        {
          method: "POST", // Use POST to add tracks
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ uris: [trackUri] }), // Correct body format
        }
      );
      savedSongs = savedSongs.filter((track) => track.trackUri !== trackUri);

      // Save updated array back to localStorage
      localStorage.setItem("savedSongs", JSON.stringify(savedSongs));

      // Remove the element from the UI (if needed)
      if (element) {
        element.remove();
      }
      renderTracks();
      loadPlaylists();
      // Remove the song from the UI if it was in a list
    } catch (error) {
      console.error("Error al afegir la cançó:", error);
    }
  }
}

async function deleteTrack(trackUri, element) {
  if (confirm("Estàs segur que vols eliminar la cançó de la playlist?")) {
    let savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];

    // Filter out the song that matches trackUri
    savedSongs = savedSongs.filter((track) => track.trackUri !== trackUri);

    // Save updated array back to localStorage
    localStorage.setItem("savedSongs", JSON.stringify(savedSongs));

    // Remove the element from the UI (if needed)
    if (element) {
      element.remove();
    }
  }
}

getUserProfile();
renderSavedTracks();
