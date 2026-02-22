import { useState, useEffect } from 'react';
import ProjectService from '../services/ProjectService';
import { Download } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './ProjectList.css';

function ProjectList({ onLoadProject, onNewProject, onConfirm }) {
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
            setError('Impossible de charger les projets : ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (pno, projectName) => {
        const confirmed = await onConfirm(
            'Supprimer le projet',
            `Êtes-vous sûr de vouloir supprimer le projet "${projectName}" ? Cette action est irréversible.`
        );
        if (confirmed) {
            try {
                await ProjectService.deleteProject(pno);
                setProjects(prev => prev.filter(p => p.pno !== pno));
            } catch (err) {
                setError('Impossible de supprimer le projet : ' + err.message);
            }
        }
    };

    const handleDownload = async (pno, projectName) => {
        try {
            const data = await ProjectService.getProject(pno);

            if (!data.files || data.files.length === 0) {
                setError('Aucun fichier à télécharger');
                return;
            }

            const zip = new JSZip();

            data.files.forEach(file => {
                if (file.filename && file.content !== undefined) {
                    const isBinary = ['png', 'jpg', 'pdf'].includes(file.file_type);
                    zip.file(file.filename, file.content, isBinary ? { base64: true } : {});
                }
            });

            const blob = await zip.generateAsync({ type: 'blob' });
            saveAs(blob, `${projectName}.zip`);
            setError('');
        } catch (err) {
            setError('Impossible de télécharger le projet : ' + err.message);
        }
    };

    return (
        <div className="project-list-container">
            <h3>Mes projets</h3>

            {error && <div className="project-error">{error}</div>}

            <button onClick={onNewProject} className="project-new-button">
                Nouveau projet
            </button>

            {loading ? (
                <div className="project-loading">Chargement...</div>
            ) : projects.length === 0 ? (
                <p className="project-empty">Aucun projet</p>
            ) : (
                <ul className="project-list">
                    {projects.map(project => (
                        <li key={project.pno} className="project-item">
                            <div className="project-name" title={project.name}>
                                {project.name.length > 15 ? project.name.slice(0, 40) + '...' : project.name}
                            </div>
                            {project.description && <p className="project-description">{project.description}</p>}
                            <small className="project-date">{new Date(project.created_at).toLocaleDateString()}</small>
                            <small className="project-id">{project.pno.slice(0, 5)}</small>
                            <div className="project-actions">
                                <button onClick={() => onLoadProject(project.pno)} className="project-action-button project-action-button-primary">
                                    Ouvrir
                                </button>
                                <button onClick={() => handleDownload(project.pno, project.name)} className="project-action-button">
                                    <Download size={16} /> Télécharger
                                </button>
                                <button onClick={() => handleDelete(project.pno, project.name)} className="project-action-button">
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
