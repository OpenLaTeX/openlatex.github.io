const jwt = require('jsonwebtoken');
const { SQLquery } = require('../db/pool');
require('dotenv').config();

const authMiddleware = async (req, projectId) => {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) return null;

    let userId;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
    } catch {
        return null;
    }

    const projectResult = await SQLquery('select uno from projects where pno = $1', [projectId]);
    if (projectResult.rows.length === 0) return null;

    const ownerUno = projectResult.rows[0].uno;
    if (ownerUno === userId) return userId;

    const userResult = await SQLquery('select email from users where uno = $1', [userId]);
    if (userResult.rows.length === 0) return null;
    const userEmail = userResult.rows[0].email;

    const collabResult = await SQLquery(
        'select 1 from project_collaborators where pno = $1 and email = $2',
        [projectId, userEmail]
    );
    if (collabResult.rows.length > 0) return userId;

    return null;
};

module.exports = authMiddleware;
