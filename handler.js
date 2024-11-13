'use strict';
import app from './index.js';
import serverless from 'serverless-http';


export const dev = serverless(app);

