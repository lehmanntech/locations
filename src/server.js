const db = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

const mongoAddr = process.env.MONGO_PORT_27017_TCP_ADDR || 'localhost';
const mongoPort = process.env.MONGO_PORT_27017_TCP_PORT || '27017';
const dbName = 'locations';

const mongoUri = `mongodb://${mongoAddr}:${mongoPort}/${dbName}`;
console.log('Conncting to MongoDB on uri', mongoUri);
db.connect(mongoUri);

const Location = db.model('Location', {
  name: {type: String, unique: true, required: true, index: true},
  lat: {type: Number, required: true},
  lng: {type: Number, required: true}
});

const Pokemon = db.model('Pokemon', {
  id: {type: String, unique: true, required: true, index: true},
  name: {type: String, required: true},
  imageUrl: {type: String, required: true}
});

const adminToken = process.env.admin_token;

const port = process.env.app_port || 8081;

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/locations', (req, res) => Location.find()
    .then(locations => res.send(locations))
    .catch(err => res.status(500).send(err)));

app.post('/locations', (req, res) => {
  const token = req.header('X-Token');

  if (token !== adminToken) {
    return res.status(401).send('Only admins can add new locations!');
  }

  const location = req.body; 

  if (!location || !location.name || !location.lat || !location.lng) {
    return res.status(400).send('Location must be {name, lat, lng}; was ' + JSON.stringify(location));
  }

  new Location(location).save()
    .then(saved => res.status(201).send(saved))
    .catch(err => res.status(500).send(err));
});

// pokemon
app.get('/locations/:id', (req, res) => {
  Pokemon.findOne({id: req.params.id})
    .then(pokemon => {
      if (!pokemon) {
        return res.status(420).send('Wrong ID!');
      }

      res.send(pokemon)
    })
    .catch(err => res.status(500).send(err));;
});

app.post('/pokemon', (req, res) => {
  const token = req.header('X-Token');
  
  if (token !== adminToken) {
    return res.status(401).send('Only admins can add new Pokémon!');
  }

  const pokemon = req.body;

  if (!pokemon || !pokemon.id || !pokemon.name || !pokemon.imageUrl) {
    return res.status(400).send('Pokemon must be {id, name, imageUrl}; was ' + JSON.stringify(pokemon));
  }

  new Pokemon(pokemon).save()
    .then(saved => res.status(201).send(saved))
    .catch(err => res.status(500).send(err));
});

app.listen(port, () => console.log('listening on port', port));
