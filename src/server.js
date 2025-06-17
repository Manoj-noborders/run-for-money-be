const app = require('./app');
const http = require('http');
const socket = require('socket.io');
const dbService = require('./database/db.service');
const { ForceEndBattleScheduler } = require('./cronJobs/forceEndBattles');
// const { xetaEventListener } = require('./blockchain/chainOps');
const port = parseInt(process.env.PORT || 4500);
const host = '0.0.0.0';
const TIMEOUT = 0;

const server = http.createServer(app);

const io = socket(server, {
  cors: { origin: '*', credentials: true }
});

global.io = io;

app.get('/', (req, res) => {
  res.status(200).send('Hi RFM Server !!!');
});

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
  console.log(`apidoct url is http://${host}:${port}/apidoc/doc/index.html`)
  // xetaEventListener();
  // server ready to accept connections here
  if (process.env.NODE_ENV !== 'local') {
    console.log('starting crons');
    ForceEndBattleScheduler.start();
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server in ', TIMEOUT);
  terminator(TIMEOUT);
});
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server in ', TIMEOUT);
  terminator(TIMEOUT);
});


process.on('uncaughtException', (exception) => {
  console.error(exception)
})

function terminator(timeout) {
  dbService.close(timeout);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(1);
  });
}

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('Address in use, retrying...');
    process.exit(1);
  }
});