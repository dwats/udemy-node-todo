const expect = require('expect');
const request = require('supertest');
const { ObjectId } = require('mongodb');

const { app } = require('./../server');
const { Todo } = require('./../models/todo');
const { User } = require('./../models/user');

const testTodos = [{
  _id: new ObjectId(),
  text: 'first test todo',
}, {
  _id: new ObjectId(),
  text: 'second test todo',
  completed: true,
  completedAt: 123456
}];

beforeEach((done) => {
  Todo.remove({})
    .then(() => Todo.insertMany(testTodos))
    .then(() => done())
    .catch(err => console.log('beforeEach error', err));
});

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    const text = 'This is some text. Look at it!';
    request(app)
      .post('/todos')
      .send({ text })
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({ text })
          .then((todos) => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          })
          .catch(e => done(e));
      });
  });


  it('should not create todo with invalid body data', (done) => {
    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo
          .find({})
          .then((todos) => {
            expect(todos.length).toBe(2);
            done();
          })
          .catch(e => done(e));
      });
  });
});

describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
      .get(`/todos/${testTodos[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(testTodos[0].text);
      })
      .end(done);
  });
  it('should 404 (invalid id)', (done) => {
    request(app)
      .get('/todos/123')
      .expect(404)
      .end(done);
  });
  it('should 404 (not found)', (done) => {
    request(app)
      .get(`/todos/${(new ObjectId()).toHexString()}`)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should remove a todo', (done) => {
    const id = testTodos[1]._id.toHexString();
    request(app)
      .delete(`/todos/${id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(id);
      })
      .end((err) => {
        if (err) return done(err);

        request(app)
          .get(`/todos/${id}`)
          .expect(404)
          .expect((res) => {
            expect(res.body.todo).toNotExist();
          })
          .end(done);
      });
  });
  it('should 404 (invalid id)', (done) => {
    request(app)
      .delete('/todos/123')
      .expect(404)
      .end(done);
  });
  it('should 404 (not found)', (done) => {
    request(app)
      .delete(`/todos/${(new ObjectId()).toHexString()}`)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('should update todo.text', (done) => {
    const id = testTodos[0]._id.toHexString();
    const text = 'new text';
    request(app)
      .patch(`/todos/${id}`)
      .send({
        text,
        completed: true
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(true);
        expect(res.body.todo.completedAt).toBeA('number');
      })
      .end(done);
  });
  it('should clear todo.completed and todo.completedAt', (done) => {
    const id = testTodos[1]._id.toHexString();
    const text = 'new text';
    request(app)
      .patch(`/todos/${id}`)
      .send({
        text,
        completed: false
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(false);
        expect(res.body.todo.completedAt).toNotExist();
      })
      .end(done);
  });
  it('should 404 (invalid id)', (done) => {
    request(app)
      .patch('/todos/123')
      .expect(404)
      .end(done);
  });
  it('should 404 (not found)', (done) => {
    request(app)
      .patch(`/todos/${(new ObjectId()).toHexString()}`)
      .expect(404)
      .end(done);
  });
});
