
import { useState, useEffect } from 'react';
import { getAdminStats } from '../api/axios';
import { useTranslation } from '../hooks/useTranslation';

const About = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalClients: 50,
    completedProjects: 200,
    yearsExperience: 10
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getAdminStats();
        if (response.data.success) {
          const data = response.data.data;
          setStats({
            totalClients: data.totalClients || 50,
            completedProjects: data.completedProjects || 200,
            yearsExperience: Math.max(10, new Date().getFullYear() - 2014) // Company founded in 2014
          });
        }
      } catch (error) {
        // Keep default values if API fails
        console.log('Using default stats - API not available');
      }
    };

    fetchStats();
  }, []);
  return (
    <section className="min-h-screen py-16 px-4 md:px-0 relative overflow-hidden">
      {/* Fondo con gradiente y elementos decorativos */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"></div>
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-56 h-56 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-br from-slate-200/15 to-blue-200/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-1/4 right-1/3 w-24 h-24 bg-gradient-to-br from-blue-200/10 to-cyan-200/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '3s'}}></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Título principal con efecto glassmorphism */}
        <div className="text-center mb-12">
          <div className="inline-block backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/20 dark:border-slate-700/20 px-8 py-4">
            <h2 className="text-4xl font-light text-slate-800 dark:text-slate-200 mb-2">{t('about.title')}</h2>
            <div className="w-20 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full"></div>
          </div>
        </div>

        {/* Contenedor principal con glassmorphism */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Información principal */}
          <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/20 dark:border-slate-700/20 shadow-2xl p-8 space-y-6">
            <h3 className="text-2xl font-light text-slate-800 dark:text-slate-200 mb-4">{t('about.ourStory.title')}</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {t('about.ourStory.description1')}
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {t('about.ourStory.description2')}
            </p>
          </div>

          {/* Valores y visión */}
          <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/20 dark:border-slate-700/20 shadow-2xl p-8 space-y-6">
            <h3 className="text-2xl font-light text-slate-800 dark:text-slate-200 mb-4">{t('about.values')}</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-slate-800 dark:text-slate-200 font-medium">{t('about.valuesList.innovation.title')}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.valuesList.innovation.description')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-slate-800 dark:text-slate-200 font-medium">{t('about.valuesList.quality.title')}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.valuesList.quality.description')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-slate-800 dark:text-slate-200 font-medium">{t('about.valuesList.transparency.title')}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.valuesList.transparency.description')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas y logros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/20 dark:border-slate-700/20 shadow-2xl p-6 text-center">
            <div className="text-3xl font-light text-slate-800 dark:text-slate-200 mb-2">{stats.yearsExperience}+</div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">{t('about.stats.yearsExperience')}</div>
          </div>
          <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/20 dark:border-slate-700/20 shadow-2xl p-6 text-center">
            <div className="text-3xl font-light text-slate-800 dark:text-slate-200 mb-2">{stats.completedProjects}+</div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">{t('about.stats.completedProjects')}</div>
          </div>
          <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/20 dark:border-slate-700/20 shadow-2xl p-6 text-center">
            <div className="text-3xl font-light text-slate-800 dark:text-slate-200 mb-2">{stats.totalClients}+</div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">{t('about.stats.satisfiedClients')}</div>
          </div>
        </div>

        {/* Servicios destacados */}
        <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/20 dark:border-slate-700/20 shadow-2xl p-8 mb-12">
          <h3 className="text-2xl font-light text-slate-800 dark:text-slate-200 mb-6 text-center">{t('about.whyChooseUs.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-slate-800 dark:text-slate-200 font-medium">{t('about.whyChooseUs.reasons.multidisciplinaryTeam.title')}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.whyChooseUs.reasons.multidisciplinaryTeam.description')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-slate-800 dark:text-slate-200 font-medium">{t('about.whyChooseUs.reasons.customSolutions.title')}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.whyChooseUs.reasons.customSolutions.description')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-slate-800 dark:text-slate-200 font-medium">{t('about.whyChooseUs.reasons.cuttingEdgeTech.title')}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.whyChooseUs.reasons.cuttingEdgeTech.description')}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-slate-800 dark:text-slate-200 font-medium">{t('about.whyChooseUs.reasons.continuousSupport.title')}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.whyChooseUs.reasons.continuousSupport.description')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-slate-800 dark:text-slate-200 font-medium">{t('about.whyChooseUs.reasons.agileMethodology.title')}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.whyChooseUs.reasons.agileMethodology.description')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-slate-800 dark:text-slate-200 font-medium">{t('about.whyChooseUs.reasons.guaranteedScalability.title')}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.whyChooseUs.reasons.guaranteedScalability.description')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Proceso de trabajo */}
        <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/20 dark:border-slate-700/20 shadow-2xl p-8">
          <h3 className="text-2xl font-light text-slate-800 dark:text-slate-200 mb-6 text-center">{t('about.ourProcess.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-semibold">1</span>
              </div>
              <h4 className="text-slate-800 dark:text-slate-200 font-medium mb-2">{t('about.ourProcess.steps.analysis.title')}</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.ourProcess.steps.analysis.description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-semibold">2</span>
              </div>
              <h4 className="text-slate-800 dark:text-slate-200 font-medium mb-2">{t('about.ourProcess.steps.design.title')}</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.ourProcess.steps.design.description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-semibold">3</span>
              </div>
              <h4 className="text-slate-800 dark:text-slate-200 font-medium mb-2">{t('about.ourProcess.steps.development.title')}</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.ourProcess.steps.development.description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-semibold">4</span>
              </div>
              <h4 className="text-slate-800 dark:text-slate-200 font-medium mb-2">{t('about.ourProcess.steps.launch.title')}</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{t('about.ourProcess.steps.launch.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;