import { useLanguage } from '../context/LanguageContext';

function PrivacyPolicy() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-xl border border-white/20 dark:border-slate-700/30 shadow-elegant p-8 md:p-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('privacy.title')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t('privacy.lastUpdated')}: {t('privacy.date')}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('privacy.introduction.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('privacy.introduction.content1')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('privacy.introduction.content2')}
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('privacy.collection.title')}
              </h2>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                {t('privacy.collection.personalInfo.title')}
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700 dark:text-gray-300">
                <li>{t('privacy.collection.personalInfo.name')}</li>
                <li>{t('privacy.collection.personalInfo.email')}</li>
                <li>{t('privacy.collection.personalInfo.phone')}</li>
                <li>{t('privacy.collection.personalInfo.company')}</li>
                <li>{t('privacy.collection.personalInfo.address')}</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                {t('privacy.collection.technicalInfo.title')}
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700 dark:text-gray-300">
                <li>{t('privacy.collection.technicalInfo.ip')}</li>
                <li>{t('privacy.collection.technicalInfo.browser')}</li>
                <li>{t('privacy.collection.technicalInfo.device')}</li>
                <li>{t('privacy.collection.technicalInfo.cookies')}</li>
                <li>{t('privacy.collection.technicalInfo.usage')}</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('privacy.usage.title')}
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{t('privacy.usage.services')}</li>
                <li>{t('privacy.usage.communication')}</li>
                <li>{t('privacy.usage.improvement')}</li>
                <li>{t('privacy.usage.support')}</li>
                <li>{t('privacy.usage.legal')}</li>
                <li>{t('privacy.usage.marketing')}</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('privacy.sharing.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('privacy.sharing.content1')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{t('privacy.sharing.consent')}</li>
                <li>{t('privacy.sharing.legal')}</li>
                <li>{t('privacy.sharing.business')}</li>
                <li>{t('privacy.sharing.protection')}</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('privacy.security.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('privacy.security.content1')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{t('privacy.security.encryption')}</li>
                <li>{t('privacy.security.access')}</li>
                <li>{t('privacy.security.monitoring')}</li>
                <li>{t('privacy.security.updates')}</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('privacy.rights.title')}
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{t('privacy.rights.access')}</li>
                <li>{t('privacy.rights.correct')}</li>
                <li>{t('privacy.rights.delete')}</li>
                <li>{t('privacy.rights.restrict')}</li>
                <li>{t('privacy.rights.portability')}</li>
                <li>{t('privacy.rights.object')}</li>
              </ul>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('privacy.cookies.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('privacy.cookies.content1')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{t('privacy.cookies.essential')}</li>
                <li>{t('privacy.cookies.analytics')}</li>
                <li>{t('privacy.cookies.preferences')}</li>
                <li>{t('privacy.cookies.marketing')}</li>
              </ul>
            </section>

            {/* Changes to Privacy Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('privacy.changes.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('privacy.changes.content')}
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('privacy.contact.title')}
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {t('privacy.contact.content')}
                </p>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p><strong>{t('privacy.contact.company')}:</strong> Borderless Techno Company</p>
                  <p><strong>{t('privacy.contact.email')}:</strong> privacy@borderlesstechno.com</p>
                  <p><strong>{t('privacy.contact.address')}:</strong> 18 N 13th St. Harrisburg, Pennsylvania, 17103 United States</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;