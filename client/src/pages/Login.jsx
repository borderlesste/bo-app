

  // src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  // Estado para manejar el checkbox "Recordar contraseña"
  
  // Cargar credenciales guardadas al montar el componente
  useEffect(() => {
    const savedCredentials = localStorage.getItem('rememberedCredentials');
    if (savedCredentials) {
      const { email: savedEmail, password: savedPassword } = JSON.parse(savedCredentials);
      setEmail(savedEmail || '');
      setPassword(savedPassword || '');
      setRememberMe(true);
    }
  }, []);

  // Manejar el cambio del checkbox
  const handleRememberMeChange = (e) => {
    const isChecked = e.target.checked;
    setRememberMe(isChecked);
    
    if (!isChecked) {
      // Si se desmarca, limpiar las credenciales guardadas
      localStorage.removeItem('rememberedCredentials');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login({ email, password });
      
      // Guardar credenciales si "Recordar contraseña" está marcado
      if (rememberMe) {
        localStorage.setItem('rememberedCredentials', JSON.stringify({
          email,
          password
        }));
      } else {
        localStorage.removeItem('rememberedCredentials');
      }
      
      // La redirección ahora se basa en el usuario del contexto
      if (user && user.rol === 'admin') {
        navigate('/admin');
      } else {
        navigate('/client');
      }
    } catch (err) {
      setError(err.userMessage || 'Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen bg-light dark:bg-dark flex items-center justify-center p-4 pt-24">
      {/* Contenedor principal con mejor distribución */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Columna izquierda - Información de bienvenida */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-8 p-8">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-dark dark:text-light">
              {t('login.title')}
            </h2>
            <p className="text-lg text-dark/70 dark:text-light/70">
              {t('login.subtitle')}
            </p>
          </div>
          
          {/* Características destacadas */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-dark dark:text-light">{t('login.benefits.personalizedDashboard')}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-dark dark:text-light">{t('login.benefits.completeServiceManagement')}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-dark dark:text-light">{t('login.benefits.transactionHistory')}</span>
            </div>
          </div>
          
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-sm text-dark/70 dark:text-light/70">{t('login.benefits.support247')}</div>
            </div>
            <div className="bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-secondary">100%</div>
              <div className="text-sm text-dark/70 dark:text-light/70">{t('login.benefits.secure100')}</div>
            </div>
          </div>
          
          {/* Mensaje motivacional */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6">
            <p className="text-dark/80 dark:text-light/80 italic">
              &ldquo;{t('login.testimonial.quote')}&rdquo;
            </p>
            <div className="mt-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-dark dark:text-light">{t('login.testimonial.author')}</p>
                <p className="text-sm text-dark/60 dark:text-light/60">{t('login.testimonial.role')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha - Formulario de login */}
        <div className="lg:col-span-7 w-full max-w-2xl lg:max-w-none mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-dark dark:text-light">{t('login.welcome')}</h1>
            <p className="text-dark/70 dark:text-light/70 mt-2">{t('login.signInAccount')}</p>
          </div>

          {/* Form Card - Ahora más ancho */}
          <div className="bg-white dark:bg-dark/70 rounded-2xl shadow-xl border border-gray-200 dark:border-secondary/20 p-8 backdrop-blur-sm">
            {error && (
              <div className="mb-6 p-4 bg-accent/20 border border-accent/30 rounded-lg">
                <p className="text-accent text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email - Ahora más espacioso */}
              <div className="group">
                <label className="block text-sm font-medium text-dark/80 dark:text-light/80 mb-2">
                  {t('login.email')} *
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-300 dark:border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200 text-dark dark:text-light placeholder-gray-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('login.emailPlaceholder')}
                />
              </div>

              {/* Password - Ahora más espacioso */}
              <div className="group">
                <label className="block text-sm font-medium text-dark/80 dark:text-light/80 mb-2">
                  {t('login.password')} *
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-300 dark:border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200 text-dark dark:text-light placeholder-gray-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t('login.passwordPlaceholder')}
                />
              </div>

              {/* Opción "Recordar contraseña" */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={handleRememberMeChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-dark/70 dark:text-light/70">
                    {t('login.rememberPassword')}
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="text-primary dark:text-secondary hover:underline font-medium">
                    {t('login.forgotPassword')}
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark"
              >
                {t('login.loginButton')}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-dark/70 dark:text-light/70">
                {t('login.noAccount')}{' '}
                <Link 
                  to="/register" 
                  className="text-primary dark:text-secondary hover:underline font-medium transition-colors duration-200"
                >
                  {t('login.register')}
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-dark/60 dark:text-light/60">
              {t('login.troubleAccessing')} {t('login.contactUs')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
