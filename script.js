const apiKey =
  'live_gdGiTmF2GsA7cb9sPMYdtbbW0ahaL9hfgEQUaYJsQRlyqtUDPbDx9p8P7eO6uN2q';
let currentIndex = 0;
let dogs = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let favPageIndex = 0;
const favPageSize = 2;
let showWarning = true; // Bandera para mostrar la advertencia solo una vez

document.addEventListener('DOMContentLoaded', function () {
  loadDogs();
  showFavorites();
  setupModal();
});

function loadDogs() {
  fetch('https://api.thedogapi.com/v1/images/search?limit=50&has_breeds=true', {
    headers: {
      'x-api-key': apiKey,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.length === 0) {
        throw new Error('No dogs found');
      }
      dogs = data.filter(
        (dog) => dog.url && dog.breeds && dog.breeds.length > 0
      );
      if (dogs.length > 0) {
        currentIndex = 0;
        displayDog();
      } else {
        throw new Error(
          'No suitable dog data with images and breeds was found'
        );
      }
    })
    .catch((error) => {
      console.error('Error loading dogs:', error);
      alert('Failed to load dogs from API: ' + error.message);
    });
}

function displayDog() {
  const dogImage = document.getElementById('dogImage');
  const dogBreed = document.getElementById('dogBreed');
  const skeleton = document.getElementById('skeleton');

  // Mostrar el esqueleto y ocultar la imagen mientras se carga
  skeleton.classList.remove('hidden');
  dogImage.classList.add('hidden');

  if (dogs[currentIndex]) {
    dogImage.src = dogs[currentIndex].url || 'path/to/placeholder.jpg';
    const distance = Math.floor(Math.random() * 31); // Distancia aleatoria entre 0 y 30 km
    dogBreed.textContent = `${
      dogs[currentIndex].breeds[0].name || 'Unknown breed'
    } - A ${distance} km de distancia`;

    // Esperar a que la imagen se cargue antes de mostrarla
    dogImage.onload = () => {
      skeleton.classList.add('hidden');
      dogImage.classList.remove('hidden');
    };
  }
}

function savePreference() {
  if (dogs[currentIndex]) {
    let dogData = {
      url: dogs[currentIndex].url,
      breed: dogs[currentIndex].breeds[0].name,
      distance: `${Math.floor(Math.random() * 100)} km away`,
      status: Math.random() > 0.5 ? 'Adoptado' : 'Disponible',
    };
    if (!favorites.some((fav) => fav.url === dogData.url)) {
      favorites.push(dogData);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      showFavorites();
      if (showWarning) {
        showAdoptionWarning();
        showWarning = false; // Establecer la bandera para no mostrar la advertencia nuevamente
      }
    }
  } else {
    console.error('No dog data available at the current index');
  }
}

function showAdoptionWarning() {
  Swal.fire({
    title: 'Advertencia',
    text: 'No compres perros, ¡adopta! Ayuda a un perro sin hogar a encontrar una familia amorosa.',
    icon: 'warning',
    confirmButtonText: 'Entendido',
  });
}

function removeFavorite(index) {
  favorites.splice(index, 1);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  if (favPageIndex * favPageSize >= favorites.length && favPageIndex > 0) {
    favPageIndex--;
  }
  showFavorites();
}

function showFavorites() {
  const grid = document.getElementById('favoritesGrid');
  const favoritesSection = document.getElementById('favoritesSection');
  const pagination = document.querySelector('.pagination');
  grid.innerHTML = '';
  pagination.innerHTML = '';

  if (favorites.length === 0) {
    favoritesSection.classList.add('hidden');
    return; // Salir de la función si no hay favoritos
  }

  favoritesSection.classList.remove('hidden');

  const start = favPageIndex * favPageSize;
  let end = Math.min(start + favPageSize, favorites.length);

  const paginatedFavorites = favorites.slice(start, end);

  paginatedFavorites.forEach((fav, index) => {
    const imgElement = document.createElement('img');
    imgElement.src = fav.url;
    imgElement.alt = fav.breed;
    imgElement.classList.add(
      'w-full',
      'h-auto',
      'object-contain',
      'cursor-pointer'
    );
    imgElement.addEventListener('click', () => openModal(fav.url));

    const caption = document.createElement('div');
    caption.textContent = `${fav.breed} - ${fav.distance} - ${fav.status}`;
    caption.classList.add('details');

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML =
      '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', () => removeFavorite(start + index));

    const container = document.createElement('div');
    container.classList.add('m-1', 'p-1', 'rounded', 'favorite-item', 'shadow');
    container.appendChild(imgElement);
    container.appendChild(caption);
    container.appendChild(deleteBtn);

    grid.appendChild(container);
  });

  const totalPages = Math.ceil(favorites.length / favPageSize);
  const createPageButton = (i, label) => {
    const pageButton = document.createElement('button');
    pageButton.textContent = label || i + 1;
    pageButton.classList.add(
      'bg-blue-500',
      'hover:bg-blue-700',
      'text-white',
      'font-bold',
      'py-1',
      'px-2',
      'rounded'
    );
    if (i === favPageIndex) {
      pageButton.classList.add('bg-blue-700');
    }
    pageButton.addEventListener('click', () => {
      favPageIndex = i;
      showFavorites();
    });
    pagination.appendChild(pageButton);
  };

  if (totalPages > 1) {
    if (favPageIndex > 0) {
      createPageButton(favPageIndex - 1, '←');
    }

    for (let i = 0; i < totalPages; i++) {
      createPageButton(i);
    }

    if (favPageIndex < totalPages - 1) {
      createPageButton(favPageIndex + 1, '→');
    }
  }
}

function setupModal() {
  const modal = document.getElementById('dogImageModal');
  const modalImg = document.getElementById('modalImage');
  const span = document.getElementsByClassName('close')[0];

  window.openModal = function (src) {
    modal.style.display = 'block';
    modalImg.src = src;
  };

  span.onclick = function () {
    modal.style.display = 'none';
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };
}

document.getElementById('next').addEventListener('click', () => {
  if (currentIndex < dogs.length - 1) {
    currentIndex++;
    displayDog();
  }
});

document.getElementById('prev').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    displayDog();
  }
});

document.getElementById('like').addEventListener('click', () => {
  savePreference();
  showLikeEffect();
  currentIndex = (currentIndex + 1) % dogs.length;
  displayDog();
});

document.getElementById('dislike').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % dogs.length;
  displayDog();
});

function showLikeEffect() {
  const likeEffect = document.getElementById('likeEffect');
  likeEffect.classList.remove('hidden');
  likeEffect.classList.add('like-effect');
  setTimeout(() => {
    likeEffect.classList.add('hidden');
    likeEffect.classList.remove('like-effect');
  }, 500);
}
