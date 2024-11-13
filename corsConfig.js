import cors from 'cors';

const devCorsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200
};

const prodCorsOptions = {
  origin: 'https://apartment-frontend-rosy.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Accept', 'x-client-key', 'x-client-token', 'x-client-secret', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

const corsOptions = process.env.NODE_ENV === 'development' ? devCorsOptions : prodCorsOptions;

export default cors(corsOptions);
