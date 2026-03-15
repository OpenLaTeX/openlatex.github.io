const express = require('express');
const request = require('supertest');

jest.mock('jsonwebtoken');

const jwt = require('jsonwebtoken');

// vrai middleware avec jwt mocké pour contrôler le comportement
const realAuth = jest.requireActual('../account-manager/middleware/auth');
const app = express();
app.use(express.json());
app.get('/projects', realAuth, (req, res) => res.json([]));

beforeEach(() => jest.clearAllMocks());

test('pas de JWT -> 401', async () => {
  const res = await request(app).get('/projects');
  expect(res.status).toBe(401);
});

test('JWT invalide -> 401', async () => {
  jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
  const res = await request(app).get('/projects').set('Authorization', 'Bearer badtoken');
  expect(res.status).toBe(401);
});
