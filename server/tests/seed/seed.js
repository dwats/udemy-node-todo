const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const { Todo } = require('./../../models/todo.js');
const { User } = require('./../../models/user');

const userOneId = new ObjectId();
const userTwoId = new ObjectId();
const testUsers = [{
  _id: userOneId,
  email: 'test1@example.com',
  password: 'userOnePass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({ _id: userOneId, access: 'auth' }, 'buttesextreme').toString()
  }]
}, {
  _id: userTwoId,
  email: 'test2@example.com',
  password: 'userTwoPass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({ _id: userTwoId, access: 'auth' }, 'buttesextreme').toString()
  }]
}];

const testTodos = [{
  _id: new ObjectId(),
  text: 'first test todo',
  _createdBy: userOneId
}, {
  _id: new ObjectId(),
  text: 'second test todo',
  completed: true,
  completedAt: 123456,
  _createdBy: userTwoId
}];

const populateTodos = (done) => {
  Todo.remove({})
    .then(() => Todo.insertMany(testTodos))
    .then(() => done())
    .catch(err => console.log('beforeEach error', err));
};

const populateUsers = (done) => {
  User.remove({})
    .then(() => {
      const userOne = new User(testUsers[0]).save();
      const userTwo = new User(testUsers[1]).save();
      return Promise.all([userOne, userTwo]);
    })
    .then(() => done());
};

module.exports = {
  testUsers,
  testTodos,
  populateUsers,
  populateTodos
};
