const express = require('express');
const request = require('supertest');

jest.mock('../account-crud-api/db/pool');
jest.mock('../account-crud-api/middleware/auth');

const { SQLquery } = require('../account-crud-api/db/pool');
const authMiddleware = require('../account-crud-api/middleware/auth');

// auth mocké : injecte userId = 1
authMiddleware.mockImplementation((req, res, next) => { req.userId = 1; next(); });

const app = express();
app.use(express.json());
app.use('/projects', require('../account-crud-api/routes/projects'));

beforeEach(() => {
  jest.clearAllMocks();
  authMiddleware.mockImplementation((req, res, next) => { req.userId = 1; next(); });
});

test('attaquant (bon JWT, mauvais proprio) -> GET /projects/:pno -> 403', async () => {
  SQLquery.mockResolvedValueOnce({ rows: [{ pno: 999, uno: 999, name: 'Test', description: '', created_at: new Date() }] });
  SQLquery.mockResolvedValueOnce({ rows: [{ email: 'pasaliceoubob@crypto.com' }] });
  SQLquery.mockResolvedValueOnce({ rows: [] });

  const res = await request(app).get('/projects/1');
  expect(res.status).toBe(403);
});

test('propriétaire -> GET /projects/:pno -> 200', async () => {
  SQLquery.mockResolvedValueOnce({ rows: [{ pno: 1, uno: 1, name: 'Test', description: '', created_at: new Date() }] });
  SQLquery.mockResolvedValueOnce({ rows: [] });

  const res = await request(app).get('/projects/1');
  expect(res.status).toBe(200);
});
