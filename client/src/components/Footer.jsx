import { Code2, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';

const Footer = () => {
  const { t } = useLanguage();
  const socialLinks = [
    { icon: "f", href: "https://www.facebook.com/people/Borderless-Tec/61579093850608/", label: "Facebook" },
    { icon: "𝕏", href: "https://twitter.com/borderlesstechno", label: "Twitter" },
    { icon: "in", href: "https://linkedin.com/company/borderless-techno", label: "LinkedIn" },
    { icon: "📷", href: "https://www.instagram.com/p/DM0zxo9P1kd/", label: "Instagram" },
    { icon: "♪", href: "https://www.tiktok.com/search?q=borderlesstechno7", label: "TikTok" }
];

  const quickLinks = [
    { name: t('nav.home'), href: "/" },
    { name: t('nav.services'), href: "/servicios" },
    { name: t('nav.portfolio'), href: "/portafolio" },
    { name: t('nav.about'), href: "/nosotros" },
    { name: 'Contacto', href: "/contacto" }
  ];

  const services = [
    t('footer.services.webDevelopment'),
    t('footer.services.mobileApps'),
    t('footer.services.backendSystems'),
    t('footer.services.cloudSolutions'),
    t('footer.services.cybersecurity'),
    t('footer.services.automation')
  ];

  return (
    <footer className="w-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-t border-white/20 dark:border-slate-700/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Code2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-base sm:text-xl font-bold text-gray-900 dark:text-white break-words">
                <span className="hidden sm:inline">BorderLESS TECHNO COMPANY</span>
                <span className="sm:hidden">BorderLESS</span>
              </span>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('footer.companyDescription')}
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2 sm:p-3 backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/20 dark:border-slate-700/30 rounded-xl
                           hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:border-blue-500 hover:text-white hover:scale-110
                           transition-all duration-300 shadow-sm hover:shadow-lg flex-shrink-0"
                  aria-label={`${t('footer.visit')} ${social.label}`}
                  title={`${t('footer.followUsOn')} ${social.label}`}
                >
                  <span className="text-xl group-hover:animate-pulse">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('footer.servicesTitle')}</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service}>
                  <span className="text-gray-600 dark:text-gray-300">
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('contact.title')}</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 dark:text-gray-300 break-words">borderlesstechno7@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300">+1 (717) 655-4737</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 dark:text-gray-300">18 N 13th St. Harrisburg, Pennsylvania, 17103 United States</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 dark:border-slate-700/30 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm text-center md:text-left">
            {t('footer.copyright')}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <Link to="/privacy-policy" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm transition-colors text-center">
              {t('footer.privacyPolicy')}
            </Link>
            <Link to="/terms-of-service" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm transition-colors text-center">
              {t('footer.termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;