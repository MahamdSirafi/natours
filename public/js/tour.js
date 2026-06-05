/* eslint-disable*/
import axios from 'axios';
import { cuteToast } from './cute/cute-alert';

export const addTour = async (body) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/tours', // Adjust the API endpoint as needed
      data: body,
    });
    if (res.data.status === 'success') {
      cuteToast({
        type: 'success',
        title: 'Success',
        message: 'Tour has been added successfully',
        timer: 1500,
      }).then(() => {
        location.assign('/'); // Redirect to the list of tours or another appropriate page
      });
    }
  } catch (err) {
    cuteToast({
      type: 'error',
      title: 'Error',
      message: err.response.data.message,
      timer: 2500,
    });
  }
};

export const deleteTour = async (id) => {
  try {
    const res = await axios({
      method: 'DELETE',
      url: `/api/v1/tours/${id}`,
      data: {},
    });
    if (res.status === 204) {
      cuteToast({
        type: 'success',
        title: 'Success',
        message: 'Tour deleted',
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
