// Passenger/cPanel-style hosts launch this file directly with `node`.
// They don't run `next start` for you, so this wraps Next's request handler
// in a plain http.Server listening on the port Passenger assigns.
const { createServer } = require('http');
const next = require('next');

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`Dear Love listening on port ${port}`);
  });
});
