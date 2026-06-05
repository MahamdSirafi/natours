/*eslint-disable */

import axios from 'axios';
import { cuteToast } from './cute/cute-alert';

export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'data'
        ? '/api/v1/users/updateMe'
        : '/api/v1/users/updateMyPassword';
    const res = await axios({
      method: 'PATCH',
      url: url,
      data: data,
    });
    if (res.data.status === 'success') {
      cuteToast({
        type: 'success',
        title: 'Success',
        message: `Your ${type} has been updated`,
        timer: 2000,
      }).then(() => {
        location.reload(true);
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
