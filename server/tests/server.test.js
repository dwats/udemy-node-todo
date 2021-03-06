const expect = require('expect');
const request = require('supertest');
const { ObjectId } = require('mongodb');

const { app } = require('./../server');
const { Todo } = require('./../models/todo');
const { User } = require('./../models/user');
const { testTodos, testUsers, populateTodos, populateUsers } = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    const text = 'This is some text. Look at it!';
    request(app)
      .post('/todos')
      .set('x-auth', testUsers[0].tokens[0].token)
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
      .set('x-auth', testUsers[0].tokens[0].token)
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
      .set('x-auth', testUsers[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(1);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
      .get(`/todos/${testTodos[0]._id.toHexString()}`)
      .set('x-auth', testUsers[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(testTodos[0].text);
      })
      .end(done);
  });

  it('should 404 (invalid id)', (done) => {
    request(app)
      .get('/todos/123')
      .set('x-auth', testUsers[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should 404 (not found)', (done) => {
    request(app)
      .get(`/todos/${(new ObjectId()).toHexString()}`)
      .set('x-auth', testUsers[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should not return todo doc created by other user', (done) => {
    request(app)
      .get(`/todos/${testTodos[1]._id.toHexString()}`)
      .set('x-auth', testUsers[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should remove a todo', (done) => {
    const id = testTodos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${id}`)
      .set('x-auth', testUsers[1].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(id);
      })
      .end((err) => {
        if (err) return done(err);

        request(app)
          .get(`/todos/${id}`)
          .set('x-auth', testUsers[1].tokens[0].token)
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
      .set('x-auth', testUsers[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should 404 (not found)', (done) => {
    request(app)
      .delete(`/todos/${(new ObjectId()).toHexString()}`)
      .set('x-auth', testUsers[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should not remove a todo from other user', (done) => {
    const id = testTodos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${id}`)
      .set('x-auth', testUsers[0].tokens[0].token)
      .expect(404)
      .end((err) => {
        if (err) return done(err);

        request(app)
          .get(`/todos/${id}`)
          .set('x-auth', testUsers[1].tokens[0].token)
          .expect(200)
          .expect((res) => {
            expect(res.body.todo).toExist();
          })
          .end(done);
      });
  });
});

describe('PATCH /todos/:id', () => {
  it('should update todo.text', (done) => {
    const id = testTodos[0]._id.toHexString();
    const text = 'new text';
    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', testUsers[0].tokens[0].token)
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
      .set('x-auth', testUsers[1].tokens[0].token)
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
      .set('x-auth', testUsers[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should 404 (not found)', (done) => {
    request(app)
      .patch(`/todos/${(new ObjectId()).toHexString()}`)
      .set('x-auth', testUsers[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should not update todo.text from other user', (done) => {
    const id = testTodos[0]._id.toHexString();
    const text = 'new text';
    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', testUsers[1].tokens[0].token)
      .send({
        text,
        completed: true
      })
      .expect(404)
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', testUsers[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(testUsers[0]._id.toHexString());
        expect(res.body.email).toBe(testUsers[0].email);
      })
      .end(done);
  });

  it('should return a 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should create a user', (done) => {
    const email = 'email@example.com';
    const password = 'password';

    request(app)
      .post('/users')
      .send({
        email,
        password
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if (err) return done(err);
        User.findOne({ email })
          .then((user) => {
            expect(user).toExist();
            expect(user.password).toNotBe(password);
            done();
          })
          .catch(e => done(e));
      });
  });

  it('should return 400 if request is invalid', (done) => {
    request(app)
      .post('/users')
      .send({
        email: 'this is invalid',
        password: ''
      })
      .expect(400)
      .end(done);
  });

  it('should not create user if email in use', (done) => {
    request(app)
      .post('/users')
      .send({
        email: testUsers[0].email,
        password: testUsers[0].password
      })
      .expect(400)
      .end(done);
  });
});

describe('POST /users/login', () => {
  it('should login users and return auth token', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: testUsers[1].email,
        password: testUsers[1].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
      })
      .end((err, res) => {
        if (err) return done(err);
        User.findById(testUsers[1]._id)
          .then((user) => {
            expect(user.tokens[1]).toInclude({
              access: 'auth',
              token: res.headers['x-auth']
            });
            done();
          })
          .catch(e => done(e));
      });
  });

  it('should reject invalid login', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: testUsers[0].email,
        password: 'ThisIsNotThePassword'
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).toNotExist();
      })
      .end((err, res) => {
        if (err) return done(err);
        User.findById(testUsers[1]._id)
          .then((user) => {
            expect(user.tokens.length).toBe(1);
            done();
          })
          .catch(e => done(e));
      });
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', testUsers[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        User.findByToken(testUsers[0].tokens[0].token)
          .then((user) => {
            expect(user).toNotExist();
            done();
          })
          .catch(e => done(e));
      });
  });
  it('should reject unauthorized requests', (done) => {
    request(app)
      .delete('/users/me/token')
      .expect(401)
      .end(done);
  });
});
