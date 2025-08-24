export default {
  // Header Navigation
  nav: {
    home: 'Accueil',
    services: 'Services',
    portfolio: 'Portfolio',
    about: 'À propos',
    dashboard: 'Tableau de bord',
    myPanel: 'Mon Panneau',
    login: 'Se connecter',
    logout: 'Se déconnecter',
    register: 'S\'inscrire'
  },
  
  // User roles
  roles: {
    admin: 'Administrateur',
    client: 'Client'
  },
  
  // Theme toggle
  theme: {
    lightMode: 'Activer le mode clair',
    darkMode: 'Activer le mode sombre'
  },
  
  // Accessibility
  accessibility: {
    openMenu: 'Ouvrir le menu de navigation',
    closeMenu: 'Fermer le menu de navigation',
    selectLanguage: 'Sélectionner la langue'
  },
  
  // Common elements
  common: {
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    cancel: 'Annuler',
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    close: 'Fermer'
  },
  
  // Home page
  home: {
    title: 'Nous Transformons les Idées en Solutions Numériques',
    subtitle: 'Solutions technologiques sans frontières',
    description: 'Nous développons des logiciels innovants, des applications web et mobiles qui stimulent la croissance de votre entreprise à l\'ère numérique',
    getStarted: 'Commencer le Projet',
    learnMore: 'Voir le Portfolio',
    servicesTitle: 'Nos Services',
    servicesSubtitle: 'Nous offrons des solutions technologiques complètes adaptées aux besoins de votre entreprise',
    aboutTitle: 'À propos de Borderless Techno Company',
    aboutDescription1: 'Nous sommes une équipe passionnée de développeurs, designers et consultants technologiques spécialisés dans la création de solutions numériques innovantes pour les entreprises de toutes tailles en Amérique latine.',
    aboutDescription2: 'Avec plus de 5 ans d\'expérience sur le marché, nous avons aidé plus de 100 entreprises à transformer numériquement leurs activités, optimiser leurs processus et atteindre leurs objectifs grâce à la technologie.',
    valuesTitle: 'Nos Valeurs',
    contactTitle: 'Prêt à commencer ?',
    contactSubtitle: 'Parlons de votre projet et découvrez comment nous pouvons vous aider à atteindre vos objectifs',
    formTitle: 'Envoyez-nous un message',
    contactInfoTitle: 'Informations de Contact',
    
    // Services section
    services: {
      webDev: {
        title: 'Développement Web',
        description: 'Nous créons des sites web modernes, responsifs et optimisés pour le SEO qui mettent en valeur votre marque en ligne.',
        features: ['React, Vue, Angular', 'E-commerce', 'CMS Personnalisé']
      },
      mobile: {
        title: 'Apps Mobiles',
        description: 'Nous développons des applications mobiles natives et hybrides pour iOS et Android avec la meilleure expérience utilisateur.',
        features: ['React Native, Flutter', 'UI/UX Design', 'Déploiement App Store']
      },
      backend: {
        title: 'Backend & APIs',
        description: 'Nous construisons des architectures robustes et évolutives avec des APIs RESTful et GraphQL pour alimenter vos applications.',
        features: ['Node.js, Python, PHP', 'Base de Données', 'Déploiement Cloud']
      },
      ai: {
        title: 'IA & Machine Learning',
        description: 'Nous intégrons l\'intelligence artificielle et le machine learning pour automatiser les processus et générer des insights précieux.',
        features: ['Chatbots IA', 'Analytique Prédictive', 'Automatisation']
      },
      security: {
        title: 'Cybersécurité',
        description: 'Nous protégeons vos actifs numériques avec des solutions de sécurité avancées et des audits de vulnérabilités.',
        features: ['Pentesting', 'Audits', 'Conseil']
      },
      consulting: {
        title: 'Conseil IT',
        description: 'Nous conseillons sur la transformation numérique de votre entreprise avec des stratégies technologiques personnalisées.',
        features: ['Architecture Logicielle', 'DevOps', 'Migration Cloud']
      }
    },
    
    // About section
    aboutStats: {
      projects: 'Projets Terminés',
      experience: 'Années d\'Expérience',
      clients: 'Clients Satisfaits',
      support: 'Support Technique'
    },
    
    values: {
      title: 'Nos Valeurs',
      innovation: {
        title: 'Innovation',
        description: 'Nous utilisons les dernières technologies et méthodologies pour créer des solutions de pointe.'
      },
      quality: {
        title: 'Qualité',
        description: 'Nous nous engageons à l\'excellence dans chaque ligne de code et design que nous créons.'
      },
      collaboration: {
        title: 'Collaboration',
        description: 'Nous travaillons main dans la main avec vous pour comprendre et dépasser vos attentes.'
      }
    },

    // Contact form
    form: {
      name: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      company: 'Entreprise',
      service: 'Service d\'Intérêt',
      message: 'Message',
      selectService: 'Sélectionnez un service',
      messagePlaceholder: 'Parlez-nous de votre projet...',
      phonePlaceholder: '+33 1 23 45 67 89',
      send: 'Envoyer le Message',
      sending: 'Envoi en cours...',
      required: '*',
      
      services: {
        webDev: 'Développement Web',
        mobile: 'Apps Mobiles',
        backend: 'Backend & APIs',
        ai: 'IA & Machine Learning',
        security: 'Cybersécurité',
        consulting: 'Conseil IT'
      },
      
      validation: {
        nameRequired: 'Le nom est requis',
        emailRequired: 'L\'email est requis',
        emailInvalid: 'Veuillez entrer un email valide',
        serviceRequired: 'Veuillez sélectionner un service',
        messageRequired: 'Le message est requis',
        generalError: 'Une erreur s\'est produite lors de l\'envoi de votre message. Veuillez réessayer.'
      },
      
      success: 'Merci pour votre message ! Nous avons reçu votre demande de devis et vous contacterons bientôt.'
    },

    // Contact info
    contactInfo: {
      location: 'Localisation',
      email: 'Email',
      phone: 'Téléphone',
      schedule: 'Horaire',
      scheduleTime: 'Lun - Ven: 9h00 - 18h00',
      followUs: 'Suivez-nous',
      needQuote: 'Besoin d\'un devis ?',
      quoteDescription: 'Programmez une consultation gratuite de 30 minutes pour discuter de votre projet',
      scheduleConsultation: 'Programmer une Consultation'
    }
  },
  
  // Services page
  services: {
    title: 'Nos Services',
    subtitle: 'Nous transformons les idées en solutions numériques innovantes qui propulsent votre entreprise vers l\'avenir.',
    seeDetails: 'Voir plus de détails →',
    
    // Process section
    process: {
      title: 'Comment travaillons-nous avec vous ?',
      consultation: {
        title: 'Consultation initiale',
        description: 'Nous analysons vos besoins et objectifs pour créer une proposition personnalisée.'
      },
      design: {
        title: 'Conception et planification',
        description: 'Nous créons des prototypes et définissons l\'architecture de votre solution.'
      },
      development: {
        title: 'Développement agile',
        description: 'Nous développons avec des méthodologies agiles avec des livraisons et feedbacks constants.'
      },
      launch: {
        title: 'Lancement et support',
        description: 'Nous déployons votre solution et vous accompagnons dans sa croissance.'
      }
    },
    
    // Technologies section
    technologies: {
      title: 'Technologies que nous maîtrisons',
      frontend: 'Frontend',
      backend: 'Backend',
      devops: 'DevOps & Cloud'
    },
    
    // Modal content
    modal: {
      mainFeatures: 'Caractéristiques principales',
      useCases: 'Cas d\'usage',
      technologiesUsed: 'Technologies utilisées',
      estimatedTime: 'Temps estimé',
      initialInvestment: 'Investissement initial',
      time: 'Temps:',
      price: 'Prix:'
    },
    
    // Service data
    servicesList: {
      webDev: {
        name: 'Développement Web',
        description: 'Sites web modernes, responsifs et optimisés pour votre entreprise.',
        features: [
          'Design responsive et mobile-first',
          'Optimisation SEO avancée',
          'Vitesse de chargement optimisée',
          'Intégration CMS',
          'Analytics et métriques'
        ],
        deliveryTime: '3-6 semaines',
        price: 'À partir de 1 500$',
        useCases: [
          'Sites web d\'entreprise',
          'Pages d\'atterrissage',
          'Portfolios professionnels',
          'Blogs et sites de contenu'
        ]
      },
      customApps: {
        name: 'Applications Sur Mesure',
        description: 'Solutions personnalisées pour automatiser et améliorer vos processus.',
        features: [
          'Design centré sur l\'utilisateur',
          'Architecture évolutive',
          'Intégration avec les systèmes existants',
          'Tableaux de bord et rapports',
          'APIs robustes'
        ],
        deliveryTime: '6-12 semaines',
        price: 'À partir de 3 500$',
        useCases: [
          'Systèmes de gestion',
          'Plateformes de travail',
          'Automatisation des processus',
          'Outils internes'
        ]
      },
      ecommerce: {
        name: 'E-commerce',
        description: 'Boutiques en ligne sécurisées, évolutives et faciles à gérer.',
        features: [
          'Gestion d\'inventaire avancée',
          'Multiples méthodes de paiement',
          'Sécurité conforme PCI',
          'Intégration logistique',
          'Analytics des ventes'
        ],
        deliveryTime: '4-8 semaines',
        price: 'À partir de 2 500$',
        useCases: [
          'Boutiques en ligne complètes',
          'Marketplaces B2B',
          'Plateformes d\'abonnement',
          'Catalogues numériques'
        ]
      },
      integrations: {
        name: 'Intégrations et APIs',
        description: 'Connectez vos systèmes et plateformes efficacement.',
        features: [
          'Synchronisation en temps réel',
          'Gestion de gros volumes',
          'Authentification sécurisée',
          'Documentation complète',
          'Monitoring et logging'
        ],
        deliveryTime: '2-4 semaines',
        price: 'À partir de 1 000$',
        useCases: [
          'Intégration CRM',
          'Connexion ERP',
          'APIs tierces',
          'Automatisation de données'
        ]
      },
      support: {
        name: 'Support et Maintenance',
        description: 'Support technique et améliorations continues pour votre projet.',
        features: [
          'Support technique prioritaire',
          'Mises à jour régulières',
          'Sauvegardes automatiques',
          'Monitoring des performances',
          'Améliorations et optimisations'
        ],
        deliveryTime: 'Service continu',
        price: 'À partir de 200$/mois',
        useCases: [
          'Maintenance préventive',
          'Support technique',
          'Mises à jour de sécurité',
          'Optimisation des performances'
        ]
      },
      consulting: {
        name: 'Conseil Numérique',
        description: 'Stratégies et conseils pour accélérer votre transformation numérique.',
        features: [
          'Analyse des besoins',
          'Stratégie technologique',
          'Feuille de route d\'implémentation',
          'Formation des équipes',
          'Suivi et amélioration'
        ],
        deliveryTime: '2-6 semaines',
        price: 'À partir de 800$',
        useCases: [
          'Audit technologique',
          'Stratégie numérique',
          'Migration cloud',
          'Optimisation des processus'
        ]
      }
    }
  },
  
  // Portfolio page
  portfolio: {
    title: 'Notre Portfolio',
    subtitle: 'Découvrez les projets que nous avons développés avec passion et dévouement pour nos clients.',
    projects: 'Projets',
    viewProject: 'Voir le Projet'
  },
  
  // About page
  about: {
    title: 'À Propos de Nous',
    mission: 'Notre Mission',
    vision: 'Notre Vision',
    values: 'Nos Valeurs',
    description: 'Nous sommes une entreprise technologique spécialisée dans le développement web et les solutions numériques.',
    teamTitle: 'Notre Équipe',
    experience: 'Années d\'Expérience',
    projects: 'Projets Terminés',
    clients: 'Clients Satisfaits',
    
    ourStory: {
      title: 'Notre Histoire',
      description1: 'Nous sommes une équipe passionnée par la technologie et l\'innovation, dédiée à créer des solutions numériques qui stimulent la croissance de nos clients. Notre mission est d\'accompagner les entreprises et entrepreneurs dans leur transformation numérique, en offrant des services de développement web, applications sur mesure et conseil technologique.',
      description2: 'Nous avons de l\'expérience dans multiples secteurs avec une approche centrée sur la qualité, la créativité et la satisfaction client. Nous croyons au travail collaboratif, à l\'amélioration continue et à la transparence dans chaque projet.'
    },
    
    valuesList: {
      innovation: {
        title: 'Innovation',
        description: 'Nous cherchons constamment de nouvelles façons de résoudre les problèmes et créer de la valeur.'
      },
      quality: {
        title: 'Qualité',
        description: 'Chaque projet est traité avec la plus grande attention aux détails et à l\'excellence.'
      },
      transparency: {
        title: 'Transparence',
        description: 'Communication claire et honnête à chaque étape du projet.'
      }
    },
    
    stats: {
      yearsExperience: 'Années d\'expérience',
      completedProjects: 'Projets terminés',
      satisfiedClients: 'Clients satisfaits'
    },
    
    whyChooseUs: {
      title: 'Pourquoi nous choisir ?',
      reasons: {
        multidisciplinaryTeam: {
          title: 'Équipe Multidisciplinaire',
          description: 'Développeurs, designers et consultants travaillant en synergie.'
        },
        customSolutions: {
          title: 'Solutions Personnalisées',
          description: 'Chaque projet est unique et conçu spécifiquement pour vos besoins.'
        },
        cuttingEdgeTech: {
          title: 'Technologies de Pointe',
          description: 'Nous utilisons les dernières technologies pour garantir les meilleures performances.'
        },
        continuousSupport: {
          title: 'Support Continu',
          description: 'Accompagnement avant, pendant et après le lancement.'
        },
        agileMethodology: {
          title: 'Méthodologie Agile',
          description: 'Nous développons avec des méthodologies agiles pour une plus grande efficacité.'
        },
        guaranteedScalability: {
          title: 'Évolutivité Garantie',
          description: 'Projets conçus pour croître avec votre entreprise.'
        }
      }
    },
    
    ourProcess: {
      title: 'Notre Processus',
      steps: {
        analysis: {
          title: 'Analyse',
          description: 'Nous étudions votre entreprise et vos objectifs pour créer la stratégie idéale.'
        },
        design: {
          title: 'Conception',
          description: 'Nous créons des prototypes et des designs qui reflètent votre vision et vos besoins.'
        },
        development: {
          title: 'Développement',
          description: 'Nous transformons la conception en une solution fonctionnelle et robuste.'
        },
        launch: {
          title: 'Lancement',
          description: 'Nous implémentons la solution et vous accompagnons dans sa croissance.'
        }
      }
    }
  },

  // Contact page
  contact: {
    title: 'Contact',
    subtitle: 'Contactez-nous',
    name: 'Nom',
    email: 'Email',
    message: 'Message',
    send: 'Envoyer',
    phone: 'Téléphone',
    address: 'Adresse',
    followUs: 'Suivez-nous'
  },

  // Login page
  login: {
    title: 'Bon retour',
    subtitle: 'Accédez à votre tableau de bord personnalisé et continuez à explorer les opportunités sans frontières.',
    welcome: 'Bienvenue',
    signInAccount: 'Connectez-vous à votre compte',
    email: 'Email',
    password: 'Mot de passe',
    emailPlaceholder: 'votre@email.com',
    passwordPlaceholder: 'Votre mot de passe',
    rememberPassword: 'Se souvenir du mot de passe',
    loginButton: 'Se Connecter',
    noAccount: 'Vous n\'avez pas de compte ?',
    createAccount: 'Créer un compte',
    register: 'S\'inscrire',
    forgotPassword: 'Mot de passe oublié ?',
    troubleAccessing: 'Problème d\'accès ?',
    contactUs: 'Contactez-nous pour de l\'aide',
    benefits: {
      personalizedDashboard: 'Tableau de bord personnalisé',
      completeServiceManagement: 'Gestion complète des services',
      transactionHistory: 'Historique des transactions',
      support247: 'Support',
      secure100: 'Sécurisé'
    },
    testimonial: {
      quote: 'Votre prochaine opportunité mondiale vous attend. Connectez-vous maintenant et découvrez ce qui est disponible.',
      author: 'Équipe Borderless',
      role: 'Votre partenaire mondial'
    }
  },

  // Register page
  register: {
    title: 'Rejoignez BORDERLESS COMPANY',
    subtitle: 'Découvrez un monde d\'opportunités sans frontières. Connectez-vous avec des professionnels du monde entier.',
    createAccount: 'Créer un Compte',
    joinCommunity: 'Rejoignez notre communauté',
    benefits: {
      globalAccess: 'Accès global aux opportunités',
      internationalNetwork: 'Réseau de contacts internationaux',
      support247: 'Support 24/7 multilingue'
    },
    testimonial: {
      quote: 'Borderless m\'a connecté avec des opportunités que je n\'avais jamais imaginées. C\'est incroyable la facilité de travailler globalement.',
      author: 'María González',
      role: 'Développeuse Frontend'
    },
    form: {
      name: 'Nom',
      nameRequired: '*',
      namePlaceholder: 'Votre nom complet',
      address: 'Adresse',
      addressRequired: '*',
      addressPlaceholder: 'Votre adresse complète',
      phone: 'Téléphone',
      phoneRequired: '*',
      phonePlaceholder: 'Votre numéro de téléphone',
      email: 'Email',
      emailRequired: '*',
      emailPlaceholder: 'votre@email.com',
      company: 'Entreprise',
      companyPlaceholder: 'Nom de votre entreprise (optionnel)',
      rfc: 'ID Fiscal',
      rfcPlaceholder: 'ID Fiscal (optionnel)',
      password: 'Mot de Passe',
      passwordRequired: '*',
      passwordPlaceholder: 'Minimum 8 caractères',
      createButton: 'Créer un Compte',
      alreadyHaveAccount: 'Vous avez déjà un compte ?',
      signIn: 'Se Connecter',
      acceptTerms: 'En vous inscrivant, vous acceptez nos termes et conditions'
    }
  },

  // Dashboard
  dashboard: {
    welcome: 'Bienvenue',
    overview: 'Aperçu',
    statistics: 'Statistiques',
    recentActivity: 'Activité Récente',
    quickActions: 'Actions Rapides',
    notifications: 'Notifications',
    profile: 'Profil',
    settings: 'Paramètres'
  },

  // Client Panel
  clientPanel: {
    myProjects: 'Mes Projets',
    activeProjects: 'Projets Actifs',
    completedProjects: 'Projets Terminés',
    invoices: 'Factures',
    payments: 'Paiements',
    support: 'Support',
    newRequest: 'Nouvelle Demande'
  },

  // Admin specific
  admin: {
    clientManagement: 'Gestion des Clients',
    projectManagement: 'Gestion de Projets',
    financialReports: 'Rapports Financiers',
    systemSettings: 'Paramètres Système',
    userActivity: 'Activité des Utilisateurs',
    analytics: 'Analytics'
  },

  // Forms
  forms: {
    required: 'Champ requis',
    invalidEmail: 'Email invalide',
    passwordTooShort: 'Mot de passe trop court',
    confirmPassword: 'Confirmer le mot de passe',
    passwordsDoNotMatch: 'Les mots de passe ne correspondent pas',
    submit: 'Soumettre',
    reset: 'Réinitialiser',
    search: 'Rechercher'
  },

  // Status
  status: {
    pending: 'En attente',
    inProgress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
    active: 'Actif',
    inactive: 'Inactif'
  },

  // Privacy Policy
  privacy: {
    title: 'Politique de Confidentialité',
    lastUpdated: 'Dernière mise à jour',
    date: '27 juillet 2025',
    introduction: {
      title: 'Introduction',
      content1: 'Chez Borderless Techno Company, nous nous engageons à protéger votre vie privée et à garantir la sécurité de vos informations personnelles. Cette Politique de Confidentialité décrit comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez nos services.',
      content2: 'En utilisant nos services, vous acceptez les pratiques décrites dans cette politique. Si vous n\'êtes pas d\'accord avec ces pratiques, nous vous recommandons de ne pas utiliser nos services.'
    },
    collection: {
      title: 'Informations que Nous Collectons',
      personalInfo: {
        title: 'Informations Personnelles',
        name: 'Nom complet',
        email: 'Adresse e-mail',
        phone: 'Numéro de téléphone',
        company: 'Nom de l\'entreprise',
        address: 'Adresse postale'
      },
      technicalInfo: {
        title: 'Informations Techniques',
        ip: 'Adresse IP',
        browser: 'Type et version du navigateur',
        device: 'Informations sur l\'appareil',
        cookies: 'Cookies et technologies similaires',
        usage: 'Données d\'utilisation du site web'
      }
    },
    usage: {
      title: 'Comment Nous Utilisons Vos Informations',
      services: 'Fournir et améliorer nos services',
      communication: 'Communiquer avec vous concernant les projets et services',
      improvement: 'Améliorer l\'expérience utilisateur',
      support: 'Fournir un support technique et un service client',
      legal: 'Respecter les obligations légales',
      marketing: 'Envoyer des communications marketing (avec votre consentement)'
    },
    sharing: {
      title: 'Partage d\'Informations',
      content1: 'Nous ne vendons, n\'échangeons, ni ne transférons vos informations personnelles à des tiers, sauf dans les circonstances suivantes :',
      consent: 'Avec votre consentement explicite',
      legal: 'Pour respecter les exigences légales',
      business: 'Avec des partenaires commerciaux de confiance pour fournir des services',
      protection: 'Pour protéger nos droits ou la sécurité d\'autrui'
    },
    security: {
      title: 'Sécurité des Données',
      content1: 'Nous mettons en œuvre des mesures de sécurité techniques, administratives et physiques pour protéger vos informations personnelles :',
      encryption: 'Chiffrement des données en transit et au repos',
      access: 'Contrôle d\'accès limité aux informations personnelles',
      monitoring: 'Surveillance continue des systèmes de sécurité',
      updates: 'Mises à jour régulières des protocoles de sécurité'
    },
    rights: {
      title: 'Vos Droits',
      access: 'Accéder à vos informations personnelles',
      correct: 'Corriger les informations inexactes',
      delete: 'Demander la suppression de vos données',
      restrict: 'Restreindre le traitement de vos données',
      portability: 'Demander la portabilité des données',
      object: 'Vous opposer au traitement pour le marketing direct'
    },
    cookies: {
      title: 'Utilisation des Cookies',
      content1: 'Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience :',
      essential: 'Cookies essentiels pour le fonctionnement du site',
      analytics: 'Cookies d\'analyse pour améliorer nos services',
      preferences: 'Cookies de préférences pour personnaliser votre expérience',
      marketing: 'Cookies marketing (avec votre consentement)'
    },
    changes: {
      title: 'Modifications de cette Politique',
      content: 'Nous nous réservons le droit de mettre à jour cette Politique de Confidentialité à tout moment. Nous vous informerons des changements importants par e-mail ou par un avis sur notre site web.'
    },
    contact: {
      title: 'Informations de Contact',
      content: 'Si vous avez des questions concernant cette Politique de Confidentialité ou souhaitez exercer vos droits, vous pouvez nous contacter :',
      company: 'Entreprise',
      email: 'Email',
      address: 'Adresse'
    }
  },

  // Terms of Service
  terms: {
    title: 'Conditions de Service',
    lastUpdated: 'Dernière mise à jour',
    date: '27 juillet 2025',
    introduction: {
      title: 'Introduction',
      content1: 'Bienvenue chez Borderless Techno Company. Ces Conditions de Service régissent l\'utilisation de nos services de développement de logiciels, d\'applications web, mobiles et de conseil technologique.',
      content2: 'En contractant nos services, vous acceptez de vous conformer à ces conditions. Si vous n\'êtes pas d\'accord, vous ne devez pas utiliser nos services.'
    },
    acceptance: {
      title: 'Acceptation des Conditions',
      content: 'En accédant et utilisant nos services, vous confirmez que vous avez lu, compris et acceptez d\'être lié par ces Conditions de Service et toutes les lois et réglementations applicables.'
    },
    services: {
      title: 'Description des Services',
      content1: 'Borderless Techno Company fournit les services suivants :',
      webDevelopment: 'Développement d\'applications web et de sites web',
      mobileDevelopment: 'Développement d\'applications mobiles pour iOS et Android',
      backend: 'Développement de backend et d\'APIs',
      consulting: 'Conseil technologique et architecture logicielle',
      security: 'Services de cybersécurité et audits',
      ai: 'Intégration d\'intelligence artificielle et d\'apprentissage automatique'
    },
    responsibilities: {
      title: 'Responsabilités de l\'Utilisateur',
      content1: 'En tant qu\'utilisateur de nos services, vous vous engagez à :',
      accurate: 'Fournir des informations précises et à jour',
      compliance: 'Respecter toutes les lois et réglementations applicables',
      security: 'Maintenir la sécurité de vos identifiants d\'accès',
      prohibited: 'Ne pas utiliser nos services pour des activités illégales',
      cooperation: 'Coopérer dans le développement et les tests des projets'
    },
    payment: {
      title: 'Conditions de Paiement',
      quotes: 'Tous les prix sont basés sur des devis personnalisés',
      methods: 'Nous acceptons les paiements par virement bancaire, carte et PayPal',
      schedule: 'Les paiements sont effectués selon le calendrier convenu',
      late: 'Les paiements en retard peuvent entraîner des frais supplémentaires',
      disputes: 'Les litiges de paiement doivent être communiqués dans les 30 jours'
    },
    intellectual: {
      title: 'Propriété Intellectuelle',
      content1: 'Les droits de propriété intellectuelle sont répartis comme suit :',
      ownership: {
        title: 'Propriété des Actifs',
        client: 'Le client possède le code et le contenu spécifiques au projet',
        company: 'Borderless Techno possède les outils et frameworks généraux',
        thirdParty: 'Tous les droits de tiers et licences sont respectés'
      }
    },
    privacy: {
      title: 'Confidentialité et Confidentialité',
      content1: 'Nous nous engageons à maintenir la confidentialité de vos informations :',
      confidential: 'Toutes les informations du projet sont traitées comme confidentielles',
      disclosure: 'Nous ne divulguons pas d\'informations sans votre consentement explicite',
      protection: 'Nous mettons en œuvre des mesures pour protéger les données sensibles'
    },
    liability: {
      title: 'Limitation de Responsabilité',
      content1: 'Notre responsabilité est limitée de la manière suivante :',
      indirect: 'Nous ne sommes pas responsables des dommages indirects ou consécutifs',
      loss: 'Nous ne sommes pas responsables de la perte de données du client',
      interruption: 'Nous ne garantissons pas une disponibilité continue sans interruption',
      maximum: 'La responsabilité maximale est limitée à la valeur du contrat'
    },
    warranties: {
      title: 'Garanties',
      content1: 'Nous fournissons les garanties suivantes dans nos services :',
      quality: 'Nous garantissons la qualité du code et les meilleures pratiques',
      timeline: 'Nous nous engageons à respecter les délais convenus',
      support: 'Nous offrons un support post-lancement selon le contrat',
      bugs: 'Nous corrigeons les erreurs identifiées pendant la période de garantie'
    },
    termination: {
      title: 'Résiliation',
      content1: 'Ces conditions peuvent être résiliées dans les circonstances suivantes :',
      convenience: 'Toute partie peut résilier avec un préavis de 30 jours',
      breach: 'Résiliation immédiate pour violation substantielle',
      effect: 'La résiliation n\'affecte pas les obligations déjà contractées'
    },
    law: {
      title: 'Loi Applicable',
      content: 'Ces conditions sont régies par les lois du Mexique. Tout litige sera résolu devant les tribunaux compétents de Mexico.'
    },
    changes: {
      title: 'Modifications des Conditions',
      content: 'Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication sur notre site web.'
    },
    contact: {
      title: 'Informations de Contact',
      content: 'Pour des questions concernant ces Conditions de Service, vous pouvez nous contacter :',
      company: 'Entreprise',
      email: 'Email',
      address: 'Adresse'
    }
  },
  payment: {
    title: "Effectuer un Paiement",
    fields: {
      concept: "Concept",
      amount: "Montant",
        reference: "Numéro de Référence",
      referencePlaceholder: "Ex : 987654321",
      noConcept: "N/A"
    },
    chooseMethod: "Sélectionnez un mode de paiement :",
    methods: {
      bank: "Virement Bancaire"
    },
    bankDetails: {
      bank: "Banque",
      account: "Numéro de Compte",
      beneficiary: "Bénéficiaire",
      clabe: "CLABE"
    },
    bankData: {
      title: "Informations pour le Virement",
      confirm: "Fait, Notifier le Paiement"
    },
    paypal: {
      title: "Procéder avec PayPal",
      description: "Vous serez redirigé vers PayPal pour compléter votre paiement en toute sécurité.",
      confirm: "Confirmer le Paiement"
    },
    simulation: "(Ceci est actuellement une simulation. Une fois confirmé, le paiement sera marqué comme payé.)",
    errors: {
      referenceRequired: "Veuillez entrer le numéro de référence."
    },
    actions: {
      copied: "Copié dans le presse-papiers"
    }
  },
  actions: {
    back: "Retour",
    cancel: "Annuler"
  },
  // Footer
  footer: {
    privacyPolicy: 'Politique de Confidentialité',
    termsOfService: 'Conditions de Service',
    companyDescription: 'Nous transformons les idées en solutions numériques innovantes. Votre partenaire technologique de confiance.',
    quickLinks: 'Liens Rapides',
    servicesTitle: 'Services',
    services: {
      webDevelopment: 'Développement Web',
      mobileApps: 'Apps Mobiles',
      backendSystems: 'Systèmes Backend',
      cloudSolutions: 'Solutions Cloud',
      cybersecurity: 'Cybersécurité',
      automation: 'Automatisation'
    },
    copyright: '© 2025 BORDERLESS TECHNO COMPANY. Tous droits réservés.',
    followUsOn: 'Suivez-nous sur',
    visit: 'Visiter'
  }
};