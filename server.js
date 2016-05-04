const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

const port = process.env.app_port || 8081;

const app = express();

app.use(cors());
app.use(bodyParser.json());

const locations = [
  {lat: 59.9113025, lng: 10.7599768},
  {lat: 59.9168131, lng: 10.7290126},
  {lat: 59.9292792, lng: 10.7149556},
  {lat: 59.9145621, lng: 10.7370329}
];

app.get('/locations', (req, res) => res.send(locations));

app.listen(port, () => console.log('listening on port', port));
