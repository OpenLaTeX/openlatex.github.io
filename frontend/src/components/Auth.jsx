import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import AuthService from '../services/AuthService';
import { UserStorage } from '../storage/UserStorage';
import './Auth.css';

function Auth({ onLogin }) {
    const { t } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState(() => UserStorage.getEmail());
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isLogin) {
                await AuthService.login(email, password);
                UserStorage.saveEmail(email);
                onLogin(email);
            } else {
                await AuthService.register(email, password);
                setIsLogin(true);
                setSuccess(t.accountCreated);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>{isLogin ? t.login : t.register}</h2>

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
                        placeholder={t.password}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="auth-input"
                    />
                </div>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}

                <div className="auth-buttons">
                    <button type="submit" disabled={loading} className="auth-button auth-button-primary">
                        {loading ? t.loading : (isLogin ? t.login : t.register)}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="auth-button"
                    >
                        {isLogin ? t.createAccount : t.loginButton}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Auth;
