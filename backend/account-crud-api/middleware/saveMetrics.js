const promClient = require('prom-client');

const projectSave = new promClient.Counter({
    name: 'project_save_total',
    help: 'Nombre total de sauvegardes de projets utilisateurs',
    labelNames: ['status_code']
});

const isProjectSave = (req) => {
    const path = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;
    return (req.method === 'POST' && path === '/projects')
        || (req.method === 'PUT' && path.startsWith('/projects/'));
};

module.exports = (req, res, next) => {
    if (isProjectSave(req)) {
        res.on('finish', () => projectSave.inc({ status_code: String(res.statusCode) }));
    }
    next();
};
