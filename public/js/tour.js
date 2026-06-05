/* eslint-disable*/
import { cuteToast } from './cute/cute-alert';

export const addTour = async (body) => {
  try {
    const res = await fetch('/api/v1/tours', {
      method: 'POST',
      body,
    });
    const json = await res.json();
    if (res.ok && json.status === 'success') {
      cuteToast({
        type: 'success',
        title: 'Success',
        message: 'Tour has been added successfully',
        timer: 1500,
      }).then(() => {
        location.assign('/');
      });
    } else {
      throw new Error(json.message || 'Failed to add tour');
    }
  } catch (err) {
    cuteToast({
      type: 'error',
      title: 'Error',
      message: err.message,
      timer: 2500,
    });
  }
};

export const deleteTour = async (id) => {
  try {
    const res = await fetch(`/api/v1/tours/${id}`, { method: 'DELETE' });
    if (res.status === 204) {
      cuteToast({
        type: 'success',
        title: 'Success',
        message: 'Tour deleted',
        timer: 1000,
      });
    } else {
      const json = await res.json();
      throw new Error(json.message || 'Failed to delete tour');
    }
  } catch (err) {
    cuteToast({
      type: 'error',
      title: 'Error',
      message: err.message,
      timer: 2000,
    });
  }
};
