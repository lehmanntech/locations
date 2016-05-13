const jwt = require('jwt-simple');
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

const Score = db.model('Score', {
  username: {type: String, required: true},
  pokemonId: {type: String, required: true}
})

const jwtSecret = process.env.jwt_secret;

if (!jwtSecret) {
  throw new Error('No jwt_secret was provided.');
}

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
app.get('/pokemon/:id', (req, res) => {
  const token = req.header('X-Token');

  if (!token) {
    return res.status(401).send('You must send a token as the HTTP header "X-Token"!');
  }

  try {
    const username = jwt.decode(token, jwtSecret);

    Pokemon.findOne({id: req.params.id})
      .then(pokemon => {
        if (!pokemon) {
          return res.status(420).send('Wrong ID!');
        }

        Score.findOne({username, pokemonId: pokemon.id})
          .then(score => {
            // only add to score if the user doesn't already have the Pokémon
            if (!score) {
                new Score({
                  username,
                  pokemonId: pokemon.id
                }).save();

                // Distinguish by returning 201 if a score is saved.
                res.status(201);
            }

            res.send(pokemon);
        })
        .catch(err => res.status(500).send(err));
      })
      .catch(err => res.status(500).send(err));
  } catch (err) {
    return res.status(401).send('Invalid token! Was: ' + token);
  }
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

app.get('/scores', (req, res) => {
  Score.find()
    .then(scores => {
      const scoresByUsername = scores.reduce(
        (byUsername, score) => {
          console.log(score);
          if (!byUsername[score.username]) {
            byUsername[score.username] = [];
          }

          byUsername[score.username].push(score.pokemonId);
          return byUsername;
        }, {});

      res.send(Object.keys(scoresByUsername).map(username => ({
        username,
        score: scoresByUsername[username].length
      })));
    })
    .catch(err => res.status(500).send(err));
});

app.get('/scores/:username', (req, res) => {
  const username = req.params.username;
  Score.find({username})
    .then(pokemonIds => {
       const score = pokemonIds.length;
       return res.send(score);
    })
    .catch(err => res.status(500).send(err));
});

app.listen(port, () => console.log('listening on port', port));
