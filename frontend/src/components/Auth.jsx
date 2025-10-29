import { useState } from 'react';
import AuthService from '../services/AuthService';

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
                onLogin();
            } else {
                await AuthService.register(email, password);
                setIsLogin(true);
                setError('compte cree, connectez vous');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto' }}>
            <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

                <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
                    {loading ? '...' : (isLogin ? 'Connexion' : 'Inscription')}
                </button>

                <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    style={{ marginLeft: '10px', padding: '8px 16px' }}
                >
                    {isLogin ? 'Creer un compte' : 'Se connecter'}
                </button>
            </form>
        </div>
    );
}

export default Auth;
