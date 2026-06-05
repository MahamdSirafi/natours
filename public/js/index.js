/* eslint-disable */
import '@babel/polyfill';
import { cuteToast } from './cute/cute-alert';
import { forgotPassword, login, logout, resetPassword, signup } from './login';
import { displayMap, ss } from './mapbox';
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
const tourMores = document.querySelectorAll('.tours__more');
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
  ss();
  tourForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = new FormData(e.currentTarget);

    const startDates = data
      .get('startDates')
      .split(',')
      .map((date) => new Date(date.trim()).toISOString());
    const startLocationDescription = data.get('startLocationDescription');
    const startLocationCoordinates = data
      .get('startLocationCoordinates')
      .split(',')
      .map((coord) => parseFloat(coord.trim()));

    data.set('startDates', JSON.stringify(startDates));

    data.set(
      'startLocation',
      JSON.stringify({
        type: 'Point',
        coordinates: startLocationCoordinates,
        description: startLocationDescription,
      })
    );

    data.set(
      'locations',
      JSON.stringify([
        {
          type: 'Point',
          coordinates: [
            startLocationCoordinates[0] - 1,
            startLocationCoordinates[1] - 1,
          ],
          description: startLocationDescription,
          day: 1,
        },
        {
          type: 'Point',
          coordinates: [
            startLocationCoordinates[0] - 0.5,
            startLocationCoordinates[1] - 0.5,
          ],
          description: startLocationDescription,
          day: 2,
        },
        {
          type: 'Point',
          coordinates: [
            startLocationCoordinates[0] + 0.5,
            startLocationCoordinates[1] + 0.5,
          ],
          description: startLocationDescription,
          day: 3,
        },
      ])
    );
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

if (tourMores) {
  tourMores.forEach((tourMore) => {
    tourMore.addEventListener('click', () => {
      const toursOption =
        tourMore.parentElement.parentElement.querySelector('.tours__options');
      toursOption.classList.add('active');

      const tourCard = toursOption.parentElement.parentElement;
      const deleteBtn = toursOption.querySelector('.tours__delete--btn');
      const tourId =
        toursOption.parentElement.parentElement.getAttribute('data-id');

      document.addEventListener('click', (e) => {
        if (
          !e.target.classList.contains('tours__options') &&
          !e.target.classList.contains('tours__more') &&
          !e.target.classList.contains('tours__delete--btn')
        ) {
          toursOption.classList.remove('active');
        }
      });

      deleteBtn.addEventListener('click', () => {
        deleteTour(tourId);
        toursOption.classList.remove('active');
        tourCard.remove();
      });
    });
  });
}

const alert = document.body.dataset.alert;
if (alert) {
  cuteToast({
    type: 'success',
    title: 'successful booking',
    message: alert,
    timer: 7000,
  });
}
