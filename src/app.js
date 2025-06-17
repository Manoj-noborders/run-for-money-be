// // @ts-check
const express = require('express');
var bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const expFileUpload = require('express-fileupload');
// const expressListEndpoints = require('express-list-endpoints');
const dbService = require('./database/db.service.js');
const { responseInterceptor, globalErrorHandler } = require('./winston.js');
const { default: axios } = require('axios');
const LoadAllRoutes = require('./routes/index.js')


dbService.start();

const app = express();



app.enable('trust proxy');

app.use(cors());
app.options('*', cors());
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});
app.use(expFileUpload());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());
/** Global API Error Handler */

//* Health Check api.
app.get('/health-check', (req, res) => {
  res.status(200).send({ status: 'Server is running' });
});
/**
 * API-DOC
*/
app.use('/assets', express.static(path.join(__dirname, '../api-doc/assets')));
app.use('/apidoc', express.static(path.join(__dirname, '../api-doc')));


// // Middleware to forward requests after main Express processing
// async function forwardRequest(request, resp, next) {
//   try {
//     // console.info(request, request.url, request.headers, "---request---41")
//     const response = await axios.post(`${process.env.XANA_MS_URL}/api/ms/save-activity-log`, {
//       headers: request.headers,
//       appName: 'nft_duel',
//       apiEndPoint: request.url
//     });
//   } catch (error) {
//     // console.error("---Error---87", error)
//     // Handle errors from the target server
//     resp.status(error.response?.status || 500).send(error.message || 'Error forwarding request');
//   } finally {
//     next();
//   }
// }

// // Use the forwarding middleware for all routes
// app.use(forwardRequest);



/**
 * LOADING ALL ROUTES AT ONCE
 */

app.use(responseInterceptor);
LoadAllRoutes(app);
app.use(globalErrorHandler);

// const endpoints = expressListEndpoints(app);

// console.info(endpoints);

app.on('close', function () {
  dbService.close();
});

module.exports = app;
