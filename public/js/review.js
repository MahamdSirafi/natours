/* eslint-disable */
import axios from 'axios';
import { cuteToast } from './cute/cute-alert';

export const addReview = async (body) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/reviews/',
      data: body,
    });
    if (res.data.status === 'success') {
      cuteToast({
        type: 'success',
        title: 'Success',
        message: 'Thanks for your review',
        timer: 1000,
      }).then(() => {
        location.reload(true);
      });
    }
  } catch (err) {
    cuteToast({
      type: 'error',
      title: 'Error',
      message: err.response.data.message,
      timer: 10000,
    });
  }
};

export const deleteReview = async (id) => {
  try {
    const res = await axios({
      method: 'DELETE',
      url: `/api/v1/reviews/${id}`,
      data: {},
    });
    if (res.status === 204) {
      cuteToast({
        type: 'success',
        title: 'Success',
        message: 'Review deleted',
        timer: 1000,
      });
    }
  } catch (err) {
    cuteToast({
      type: 'error',
      title: 'Error',
      message: err.response.data.message,
      timer: 2000,
    });
  }
};
export const updateReview = async (review, rating, id) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/reviews/${id}`,
      data: { review, rating },
    });
    if (res.data.status === 'success') {
      cuteToast({
        type: 'success',
        title: 'Success',
        message: 'Review has been updated',
        timer: 1000,
      });
    }
  } catch (err) {
    cuteToast({
      type: 'error',
      title: 'Error',
      message: err.response.data.message,
      timer: 10000,
    });
  }
};

export const colorStars = (stars) => {
  stars.forEach((e) => {
    e.addEventListener('click', () => {
      for (let index = 0; index < stars.length; index++) {
        stars[index].classList.remove('star--active');
      }
      for (let index = 0; index < e.getAttribute('data-num'); index++) {
        stars[index].classList.toggle('star--active');
      }
    });
  });
};
