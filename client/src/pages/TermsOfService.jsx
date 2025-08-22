import { useLanguage } from '../context/LanguageContext';

function TermsOfService() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-xl border border-white/20 dark:border-slate-700/30 shadow-elegant p-8 md:p-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('terms.title')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t('terms.lastUpdated')}: {t('terms.date')}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.introduction.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('terms.introduction.content1')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('terms.introduction.content2')}
              </p>
            </section>

            {/* Acceptance of Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.acceptance.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('terms.acceptance.content')}
              </p>
            </section>

            {/* Services Description */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.services.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('terms.services.content1')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{t('terms.services.webDevelopment')}</li>
                <li>{t('terms.services.mobileDevelopment')}</li>
                <li>{t('terms.services.backend')}</li>
                <li>{t('terms.services.consulting')}</li>
                <li>{t('terms.services.security')}</li>
                <li>{t('terms.services.ai')}</li>
              </ul>
            </section>

            {/* User Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.responsibilities.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('terms.responsibilities.content1')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{t('terms.responsibilities.accurate')}</li>
                <li>{t('terms.responsibilities.compliance')}</li>
                <li>{t('terms.responsibilities.security')}</li>
                <li>{t('terms.responsibilities.prohibited')}</li>
                <li>{t('terms.responsibilities.cooperation')}</li>
              </ul>
            </section>

            {/* Payment Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.payment.title')}
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{t('terms.payment.quotes')}</li>
                <li>{t('terms.payment.methods')}</li>
                <li>{t('terms.payment.schedule')}</li>
                <li>{t('terms.payment.late')}</li>
                <li>{t('terms.payment.disputes')}</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.intellectual.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('terms.intellectual.content1')}
              </p>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                {t('terms.intellectual.ownership.title')}
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700 dark:text-gray-300">
                <li>{t('terms.intellectual.ownership.client')}</li>
                <li>{t('terms.intellectual.ownership.company')}</li>
                <li>{t('terms.intellectual.ownership.thirdParty')}</li>
              </ul>
            </section>

            {/* Privacy and Confidentiality */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.privacy.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('terms.privacy.content1')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{t('terms.privacy.confidential')}</li>
                <li>{t('terms.privacy.disclosure')}</li>
                <li>{t('terms.privacy.protection')}</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.liability.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('terms.liability.content1')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{t('terms.liability.indirect')}</li>
                <li>{t('terms.liability.loss')}</li>
                <li>{t('terms.liability.interruption')}</li>
                <li>{t('terms.liability.maximum')}</li>
              </ul>
            </section>

            {/* Warranties */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.warranties.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('terms.warranties.content1')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{t('terms.warranties.quality')}</li>
                <li>{t('terms.warranties.timeline')}</li>
                <li>{t('terms.warranties.support')}</li>
                <li>{t('terms.warranties.bugs')}</li>
              </ul>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.termination.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('terms.termination.content1')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{t('terms.termination.convenience')}</li>
                <li>{t('terms.termination.breach')}</li>
                <li>{t('terms.termination.effect')}</li>
              </ul>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.law.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('terms.law.content')}
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.changes.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('terms.changes.content')}
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('terms.contact.title')}
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {t('terms.contact.content')}
                </p>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p><strong>{t('terms.contact.company')}:</strong> Borderless Techno Company</p>
                  <p><strong>{t('terms.contact.email')}:</strong> legal@borderlesstechno.com</p>
                  <p><strong>{t('terms.contact.address')}:</strong> 18 N 13th St. Harrisburg, Pennsylvania, 17103 United States</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;