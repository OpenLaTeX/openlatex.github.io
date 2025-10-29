import { useState, useEffect } from 'react';
import ProjectService from '../services/ProjectService';

function ProjectList({ onLoadProject, onNewProject }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await ProjectService.getProjects();
            setProjects(data);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (pno) => {
        if (!confirm('Supprimer ce projet ?')) return;

        try {
            await ProjectService.deleteProject(pno);
            setProjects(projects.filter(p => p.pno !== pno));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>chargement...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h3>Mes projets</h3>

            {error && <div style={{ color: 'red' }}>{error}</div>}

            <button onClick={onNewProject} style={{ marginBottom: '10px' }}>
                Nouveau projet
            </button>

            {projects.length === 0 ? (
                <p>aucun projet</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {projects.map(project => (
                        <li key={project.pno} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px' }}>
                            <strong>{project.name}</strong>
                            {project.description && <p>{project.description}</p>}
                            <small>{new Date(project.created_at).toLocaleDateString()}</small>
                            <div style={{ marginTop: '5px' }}>
                                <button onClick={() => onLoadProject(project.pno)} style={{ marginRight: '5px' }}>
                                    Ouvrir
                                </button>
                                <button onClick={() => handleDelete(project.pno)}>
                                    Supprimer
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ProjectList;
