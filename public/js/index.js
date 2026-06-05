/* eslint-disable */
import '@babel/polyfill';
import { cuteToast } from './cute/cute-alert';
import { forgotPassword, login, logout, resetPassword, signup } from './login';
import { displayMap, initTourMap } from './mapbox';
import { addReview, deleteReview, updateReview, colorStars } from './review';
import { bookTour } from './stripe';
import { updateSettings } from './updateUser';
import { deleteTour, addTour } from './tour';

//DOM Elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form-login');
const signupForm = document.querySelector('.form-signup');
const tourForm = document.querySelector('.form-add-tour');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateUserDataFrom = document.querySelector('.form-user-data');
const updateUserPasswordForm = document.querySelector('.form-user-settings');
const reviewForm = document.querySelector('.review-form');
const reviewMores = document.querySelectorAll('.reviews__more');
const reviewEditForms = document.querySelectorAll('.reviews__edit__form');
const forgotPasswordForm = document.querySelector('.form-forget');
const resetPasswordForm = document.querySelector('.form-reset');
const bookBtn = document.getElementById('book-tour');
let reviewCard = '';
let reviewText = '';
let reviewStars = '';
let reviewId = '';

//Delegation
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = data.get('email');
    const password = data.get('password');
    login({ email, password });
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = data.get('name');
    const email = data.get('email');
    const password = data.get('password');
    const passwordConfirm = data.get('passwordConfirm');
    const photo = new FormData();
    signup({ name, email, password, passwordConfirm });
  });
}

if (tourForm) {
  fetchGuides();
  initGuideSelector();

  let tourMap = null;
  try { tourMap = initTourMap(); } catch (e) { console.error('Map init error:', e); }

  const tourLocations = [];
  let locStartIndex = -1;

  function syncTourLocations() {
    document.getElementById('locations-data').value = JSON.stringify(tourLocations);
    renderTourLocationsList();
  }

  function renderTourLocationsList() {
    const container = document.getElementById('locations-list');
    if (!container) return;
    if (tourLocations.length === 0) {
      container.innerHTML = '<p class="locations-empty">No locations added yet</p>';
      return;
    }
    container.innerHTML = tourLocations.map((loc, i) => `
      <div class="location-item ${i === locStartIndex ? 'location-item--start' : ''}">
        <span class="location-item__info">
          ${i === locStartIndex ? '🚩' : '📍'}
          ${loc.description || 'Location ' + (i + 1)}
          <small>Day ${loc.day} (${loc.coordinates[0].toFixed(4)}, ${loc.coordinates[1].toFixed(4)})</small>
        </span>
        <div class="location-item__actions">
          <button type="button" class="btn btn--small btn--green btn--set-start" data-index="${i}">Start</button>
          <button type="button" class="btn btn--small btn--black btn--remove-loc" data-index="${i}">Remove</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn--remove-loc').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        tourLocations.splice(idx, 1);
        if (locStartIndex === idx) locStartIndex = -1;
        else if (locStartIndex > idx) locStartIndex--;
        if (tourMap && tourMap.clearMapMarkers) tourMap.clearMapMarkers();
        tourLocations.forEach((l) => {
          if (tourMap && tourMap.addMarkerToMap) tourMap.addMarkerToMap(l.coordinates[0], l.coordinates[1], l.description, l.day);
        });
        syncTourLocations();
      });
    });

    container.querySelectorAll('.btn--set-start').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        locStartIndex = idx;
        const loc = tourLocations[idx];
        document.getElementById('startLocationCoordinates').value = loc.coordinates.join(',');
        syncTourLocations();
      });
    });
  }

  function showLocationForm() {
    document.getElementById('loc-desc').value = '';
    document.getElementById('loc-day').value = tourLocations.length + 1;
    document.getElementById('loc-lng').value = '';
    document.getElementById('loc-lat').value = '';
    document.getElementById('location-form-wrapper').style.display = 'block';
    if (tourMap && tourMap.startPicking) tourMap.startPicking();
  }

  function hideLocationForm() {
    document.getElementById('location-form-wrapper').style.display = 'none';
  }

  document.getElementById('add-location-btn')?.addEventListener('click', showLocationForm);

  document.getElementById('location-save')?.addEventListener('click', () => {
    const desc = document.getElementById('loc-desc').value.trim();
    const day = parseInt(document.getElementById('loc-day').value) || tourLocations.length + 1;
    const lng = parseFloat(document.getElementById('loc-lng').value);
    const lat = parseFloat(document.getElementById('loc-lat').value);
    if (!desc) { cuteToast({ type: 'error', title: 'Error', message: 'Please enter a description', timer: 2000 }); return; }
    if (isNaN(lng) || isNaN(lat)) { cuteToast({ type: 'error', title: 'Error', message: 'Please click on the map to select coordinates', timer: 2000 }); return; }

    tourLocations.push({
      type: 'Point',
      coordinates: [lng, lat],
      description: desc,
      day,
    });

    if (tourMap && tourMap.addMarkerToMap) tourMap.addMarkerToMap(lng, lat, desc, day);

    if (tourLocations.length === 1) {
      locStartIndex = 0;
      document.getElementById('startLocationCoordinates').value = `${lng}, ${lat}`;
    }

    syncTourLocations();
    hideLocationForm();
    cuteToast({ type: 'success', title: 'Location added', message: 'You can add another location', timer: 1500 });
  });

  document.getElementById('location-cancel')?.addEventListener('click', hideLocationForm);

  tourForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = new FormData(e.currentTarget);

    const startDates = data
      .get('startDates')
      .split(',')
      .map((date) => new Date(date.trim()).toISOString());
    data.set('startDates', JSON.stringify(startDates));

    const guides = JSON.parse(document.getElementById('guides-data').value || '[]');
    data.set('guides', JSON.stringify(guides));

    const startCoordStr = document.getElementById('startLocationCoordinates').value;
    const startCoords = startCoordStr.split(',').map((c) => parseFloat(c.trim()));
    if (startCoords.length === 2 && !isNaN(startCoords[0])) {
      const startLoc = tourLocations.find(
        (l) => l.coordinates[0] === startCoords[0] && l.coordinates[1] === startCoords[1]
      );
      data.set(
        'startLocation',
        JSON.stringify({
          type: 'Point',
          coordinates: startCoords,
          description: startLoc ? startLoc.description : 'Starting point',
        })
      );
    }

    addTour(data);
  });
}

if (updateUserDataFrom) {
  updateUserDataFrom.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateSettings(formData, 'data');
  });
}

if (updateUserPasswordForm) {
  updateUserPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = data.get('password');
    const passwordConfirm = data.get('passwordConfirm');
    const passwordCurrent = data.get('passwordCurrent');
    await updateSettings(
      { password, passwordConfirm, passwordCurrent },
      'password'
    );
  });
}

if (reviewForm) {
  const stars = reviewForm.querySelectorAll('.star');
  colorStars(stars);
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const save = reviewForm.querySelector('.save');
    const review = reviewForm.querySelector('#review-input').value;
    const tour = document.querySelector('.tour-id').getAttribute('data-id');
    let rating = 0;
    stars.forEach((e) => {
      if (e.classList.contains('star--active')) rating++;
    });
    save.textContent = 'Posting...';
    await addReview({ review, rating, tour });
    save.textContent = 'Add';
  });
}

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = data.get('email');

    await forgotPassword({ email });
  });
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const resetToken = data.get('resetToken');
    const password = data.get('password');
    const passwordConfirm = data.get('passwordConfirm');
    resetPassword(password, passwordConfirm, resetToken);
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', async (e) => {
    const { tourId } = e.target.dataset;
    e.target.textContent = 'Processing...';
    await bookTour(tourId);
    e.target.fromtextContent = 'Book tour now!';
  });
}

if (reviewMores) {
  reviewMores.forEach((reviewMore) => {
    reviewMore.addEventListener('click', () => {
      const reviewsOption =
        reviewMore.parentElement.parentElement.querySelector(
          '.reviews__options'
        );
      reviewsOption.classList.add('active');

      const reviewCard = reviewsOption.parentElement;
      const reviewText = reviewCard.querySelector('.reviews__text');
      const reviewStars = reviewCard.querySelectorAll(
        '.reviews_stars .reviews__star'
      );
      const deleteBtn = reviewsOption.querySelector('.reviews__delete--btn');
      const editBtn = reviewsOption.querySelector('.reviews__edit--btn');
      const reviewId = reviewsOption.parentElement.getAttribute('data-id');

      document.addEventListener('click', (e) => {
        if (
          !e.target.classList.contains('reviews__options') &&
          !e.target.classList.contains('reviews__more') &&
          !e.target.classList.contains('reviews__edit--btn') &&
          !e.target.classList.contains('reviews__delete--btn')
        ) {
          reviewsOption.classList.remove('active');
        }
      });

      deleteBtn.addEventListener('click', () => {
        deleteReview(reviewId);
        reviewsOption.classList.remove('active');
        reviewCard.remove();
      });

      editBtn.addEventListener('click', () => {
        const reviewEdit = reviewCard.querySelector('.reviews__edit');
        reviewEdit.classList.add('active');
        reviewsOption.classList.remove('active');

        reviewEditForms.forEach((reviewEditForm) => {
          const cancel = reviewEditForm.querySelector('.cancel');
          const update = reviewEditForm.querySelector('.update');
          const stars = reviewEditForm.querySelectorAll('.star');

          cancel.addEventListener('click', () =>
            reviewEdit.classList.remove('active')
          );

          colorStars(stars);
          reviewEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const review = reviewEditForm.querySelector('#review-input').value;
            let rating = 0;
            stars.forEach((star) => {
              if (star.classList.contains('star--active')) rating++;
            });
            update.textContent = 'Updating...';
            await updateReview(review, rating, reviewId);
            reviewText.textContent = review;

            for (let index = 0; index < rating; index++) {
              reviewStars[index].classList.remove('reviews__star--inactive');
              reviewStars[index].classList.add('reviews__star--active');
            }
            for (let index = rating; index < 5; index++) {
              reviewStars[index].classList.remove('reviews__star--active');
              reviewStars[index].classList.add('reviews__star--inactive');
            }
            reviewEdit.classList.remove('active');
            update.textContent = 'Update';
          });
        });
      });
    });
  });
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn--delete-tour');
  if (!btn) return;
  e.stopPropagation();
  const tourCard = btn.closest('.card');
  const tourId = btn.dataset.id;
  if (!confirm('Delete this tour permanently?')) return;
  await deleteTour(tourId);
  if (tourCard) tourCard.remove();
});

const alert = document.body.dataset.alert;
if (alert) {
  cuteToast({
    type: 'success',
    title: 'successful booking',
    message: alert,
    timer: 7000,
  });
}

const allGuides = [];

async function fetchGuides() {
  try {
    const res = await fetch('/api/v1/users/guides');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    const guides = json.data.data;
    allGuides.push(...guides);
    const selector = document.getElementById('guide-selector');
    guides.forEach((guide) => {
      const opt = document.createElement('option');
      opt.value = guide._id;
      opt.textContent = `${guide.name} (${guide.role})`;
      selector.appendChild(opt);
    });
  } catch (err) {
    const msg = err.message || 'Failed to load guides';
    cuteToast({ type: 'error', title: 'Error', message: msg, timer: 3000 });
  }
}

function renderSelectedGuides() {
  const container = document.getElementById('selected-guides');
  const guidesData = document.getElementById('guides-data');
  const selectedIds = JSON.parse(guidesData.value || '[]');

  if (selectedIds.length === 0) {
    container.innerHTML = '<p class="locations-empty">No guides selected</p>';
    return;
  }

  container.innerHTML = selectedIds
    .map((id) => {
      const guide = allGuides.find((g) => g._id === id);
      if (!guide) return '';
      return `
        <div class="location-item">
          <span class="location-item__info">${guide.name} (${guide.role})</span>
          <button type="button" class="btn btn--small btn--black remove-guide" data-id="${id}">Remove</button>
        </div>
      `;
    })
    .join('');

  container.querySelectorAll('.remove-guide').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const current = JSON.parse(guidesData.value || '[]');
      guidesData.value = JSON.stringify(current.filter((gid) => gid !== id));
      renderSelectedGuides();
    });
  });
}

function initGuideSelector() {
  const addGuideBtn = document.getElementById('add-guide-btn');
  const guideSelector = document.getElementById('guide-selector');
  const guideSelectWrapper = document.getElementById('guide-select-wrapper');

  if (!addGuideBtn || !guideSelector || !guideSelectWrapper) {
    console.error('Guide selector elements not found');
    return;
  }

  addGuideBtn.addEventListener('click', () => {
    guideSelectWrapper.style.display = 'block';
    guideSelector.focus();
  });

  guideSelector.addEventListener('change', () => {
    const id = guideSelector.value;
    if (!id) return;
    const guidesData = document.getElementById('guides-data');
    const current = JSON.parse(guidesData.value || '[]');
    if (!current.includes(id)) {
      current.push(id);
      guidesData.value = JSON.stringify(current);
    }
    guideSelector.value = '';
    guideSelectWrapper.style.display = 'none';
    renderSelectedGuides();
  });

  document.addEventListener('click', (e) => {
    if (
      !e.target.closest('#guide-select-wrapper') &&
      !e.target.closest('#add-guide-btn')
    ) {
      guideSelectWrapper.style.display = 'none';
    }
  });
}
