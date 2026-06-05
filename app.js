import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import xss from 'xss-clean';
import cors from 'cors';
import hpp from 'hpp';
import compression from 'compression';
// import csurf from 'csurf';
import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import viewRouter from './routes/viewRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import globalErrorHandler from './controllers/errorController.js';
import AppError from './utils/appError.js';
import { webhookCheckout } from './controllers/bookingController.js';

const app = express();

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const csrfProtection = csurf({ cookie: true });

//PUG
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1) Global middlewares
//cors
app.use(cors());

app.options('*', cors());

//Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//Set security headers
const scriptSrcUrls = [
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://cdnjs.cloudflare.com/',
];
const styleSrcUrls = [
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = [
  'https://api.mapbox.com/',
  'https://a.tiles.mapbox.com/',
  'https://b.tiles.mapbox.com/',
  'https://events.mapbox.com/',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:'],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);
//for logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Avoid exploit Node.js security weaknesses
app.disable('x-powered-by');

//Limit the requests for the same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

//stripe webhook
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);
//Read the data from the body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(csrfProtection);

//Data sanitization against NoSql query injection like email:{$gt:""}
app.use(mongoSanitize());

//Data sanitization against XSS like send html with some js in any param or...
app.use(xss());

//Prevent http params pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'difficulty',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
      'maxGroupSize',
    ],
  })
);

app.use(compression());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//2)Routes

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // for route(URL) /api/v1/tours we use tourRouter (tour middleware in url /api/v1/tours)
app.use('/api/v1/users', userRouter); //it means for route(URL) /api/v1/users we use userRouter
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//for other routes
app.all('*', (req, res, next) => {
  //req.originalURl mean the route was sent
  next(new AppError(404, `Can't find ${req.originalUrl} on this server`)); //skip all middleware and go to the errors handler
});

app.use(globalErrorHandler);
//and the other middleware like morgan used in the  all routes
export default app;
