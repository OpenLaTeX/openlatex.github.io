import { useState } from 'react';
import AuthService from '../services/AuthService';
import { UserStorage } from '../storage/UserStorage';
import './Auth.css';

function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await AuthService.login(email, password);
                UserStorage.saveEmail(email);
                onLogin(email);
            } else {
                await AuthService.register(email, password);
                setIsLogin(true);
                setError('Compte créé avec succès, vous pouvez maintenant vous connecter !');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-input-group">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="auth-input"
                    />
                </div>

                <div className="auth-input-group">
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="auth-input"
                    />
                </div>

                {error && <div className="auth-error">{error}</div>}

                <div className="auth-buttons">
                    <button type="submit" disabled={loading} className="auth-button auth-button-primary">
                        {loading ? 'Chargement...' : (isLogin ? 'Connexion' : 'Inscription')}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="auth-button"
                    >
                        {isLogin ? 'Créer un compte' : 'Se connecter'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Auth;
