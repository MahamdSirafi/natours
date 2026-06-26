import mongoose from 'mongoose';
import app from './app.js';
import './utils/unCaughtException.js';

const { DB } = process.env;
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection succeeded'))
  .catch((err) => console.log('Mongo connection error', err));
const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);
//We can put this code in single file and import it but it not important but in uncaughtException we import it for calling him first

//for unhandled rejection like mongo connection failed and this handler work for async rejection
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully!');
  server.close(() => {
    console.log('💥 Process terminated');
  });
});
