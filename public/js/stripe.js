/*eslint-disable */
import Stripe from 'stripe';
import axios from 'axios';
import { cuteToast } from './cute/cute-alert';

const stripe = new Stripe(
  'pk_test_51MlsyTDHCnKyZsj1opG7QfNnAgppZhevuyIdUn07wayuWfLMgf7gZYimQSueropdrwVNaigpiEEYeMt0rtAREQZY002aFju2pS'
);

export const bookTour = async (tourId) => {
  try {
    const session = await axios.get(
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    window.open(session.data.session.url, '_blank');
  } catch (err) {
    cuteToast({
      type: 'error',
      title: 'Error',
      message: err.response.data.message,
      timer: 2500,
    });
  }
};
