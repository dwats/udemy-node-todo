const { ObjectId } = require('mongodb');

const { Todo } = require('./../../models/todo.js');

const testTodos = [{
  _id: new ObjectId(),
  text: 'first test todo',
}, {
  _id: new ObjectId(),
  text: 'second test todo',
  completed: true,
  completedAt: 123456
}];

const populateTodos = (done) => {
  Todo.remove({})
    .then(() => Todo.insertMany(testTodos))
    .then(() => done())
    .catch(err => console.log('beforeEach error', err));
};

module.exports = {
  testTodos,
  populateTodos
};
