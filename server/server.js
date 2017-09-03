const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

require('./config/config');
const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
  const todo = new Todo({
    text: req.body.text,
    _createdBy: req.user._id
  });

  todo
    .save()
    .then((doc) => {
      res.send(doc);
    }, (err) => {
      res.status(400).send(err);
    });
});

app.get('/todos', authenticate, (req, res) => {
  Todo
    .find({
      _createdBy: req.user._id
    })
    .then((todos) => {
      res.send({ todos });
    }, (e) => {
      res.status(400).send(e);
    });
});

app.get('/todos/:id', authenticate, (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) return res.status(404).send();
  Todo
    .findOne({
      _id: id,
      _createdBy: req.user._id
    })
    .then((todo) => {
      if (!todo) return res.status(404).send();
      return res.send({ todo });
    }, () => {
      res.status(400).send();
    });
});

app.delete('/todos/:id', authenticate, (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) return res.status(404).send();
  Todo
    .findOneAndRemove({
      _id: id,
      _createdBy: req.user._id
    })
    .then((todo) => {
      if (!todo) return res.status(404).send();
      return res.send({ todo });
    })
    .catch(() => {
      res.status(400).send();
    });
});

app.patch('/todos/:id', authenticate, (req, res) => {
  const id = req.params.id;
  const body = _.pick(req.body, ['text', 'completed']);
  if (!ObjectId.isValid(id)) return res.status(404).send();
  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  }
  else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo
    .findOneAndUpdate({
      _id: id,
      _createdBy: req.user._id
    }, { $set: body }, { new: true })
    .then((todo) => {
      if (!todo) return res.status(404).send();
      return res.send({ todo });
    })
    .catch(() => {
      res.status(404).send();
    });
});

app.post('/users', (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);
  const user = new User(body);

  user
    .save()
    .then(() => user.generateAuthToken())
    .then((token) => {
      res.header('x-auth', token).send(user);
    })
    .catch((e) => {
      res.status(400).send(e.message);
    });
});

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

app.post('/users/login', (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password)
    .then(user => user.generateAuthToken()
      .then((token) => {
        res.header('x-auth', token).send(user);
      })
    )
    .catch(() => {
      res.status(400).send();
    });
});

app.delete('/users/me/token', authenticate, (req, res) => {
  req.user
    .removeToken(req.token)
    .then(() => {
      res.status(200).send();
    })
    .catch(() => {
      res.status(400).send();
    });
});

app.listen(port, () => {
  console.log(`Started at port ${port}`);
});

module.exports = { app };
