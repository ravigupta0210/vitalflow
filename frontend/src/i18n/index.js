import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      app_name: 'VitalFlow',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      none: 'None',

      // Navigation
      nav: {
        dashboard: 'Dashboard',
        workouts: 'Workouts',
        exercises: 'Exercise Library',
        diet: 'Diet Plans',
        chat: 'AI Coach',
        profile: 'Profile',
        settings: 'Settings',
        notifications: 'Notifications',
        logout: 'Logout'
      },

      // Dashboard
      dashboard: {
        welcome: 'Welcome back',
        health_score: 'Health Score',
        daily_progress: 'Daily Progress',
        calories: 'Calories',
        protein: 'Protein',
        water: 'Water',
        steps: 'Steps',
        workout_today: "Today's Workout",
        no_workout: 'No workout scheduled',
        view_all: 'View All',
        quick_actions: 'Quick Actions',
        log_workout: 'Log Workout',
        log_meal: 'Log Meal',
        track_weight: 'Track Weight',
        ai_insights: 'AI Insights'
      },

      // Settings
      settings: {
        title: 'Settings',
        subtitle: 'Manage your app preferences',
        save_changes: 'Save Changes',
        saved: 'Saved!',
        saving: 'Saving...',

        // Notifications section
        notifications: 'Notifications',
        email_notifications: 'Email Notifications',
        email_notifications_desc: 'Receive updates and reminders via email',
        push_notifications: 'Push Notifications',
        push_notifications_desc: 'Get instant notifications on your device',
        weekly_report: 'Weekly Health Report',
        weekly_report_desc: 'Receive a summary of your progress every week',
        workout_reminders: 'Workout Reminders',
        workout_reminders_desc: 'Get reminded about your scheduled workouts',

        // Phone section
        phone_number: 'Phone Number',
        phone_desc: 'Add your phone number to enable SMS login and receive important alerts',
        enter_phone: 'Enter phone number',
        verify: 'Verify',
        verified: 'Verified',
        enter_otp: 'Enter 6-digit OTP',

        // Appearance section
        appearance: 'Appearance',
        dark_mode: 'Dark Mode',
        dark_mode_desc: 'Use dark theme for the application',
        language: 'Language',
        language_desc: 'Select your preferred language',
        measurement_units: 'Measurement Units',
        measurement_units_desc: 'Choose metric or imperial units',
        metric: 'Metric (kg, cm)',
        imperial: 'Imperial (lbs, ft)',

        // Privacy section
        privacy_security: 'Privacy & Security',
        two_factor: 'Two-Factor Authentication',
        two_factor_desc: 'Add an extra layer of security to your account',
        data_sharing: 'Data Sharing',
        data_sharing_desc: 'Share anonymized data to improve the app',

        // Danger zone
        danger_zone: 'Danger Zone',
        delete_account: 'Delete Account',
        delete_account_desc: 'Permanently delete your account and all data',
        delete_confirm: 'This action cannot be undone. Please enter your password to confirm:',
        enter_password: 'Enter your password',
        confirm_delete: 'Confirm Delete',
        deleting: 'Deleting...'
      },

      // Notifications page
      notifications_page: {
        title: 'Notifications',
        unread_count: 'You have {{count}} unread notification',
        unread_count_plural: 'You have {{count}} unread notifications',
        all_caught_up: 'All caught up!',
        mark_all_read: 'Mark all read',
        clear_all: 'Clear all',
        no_notifications: 'No notifications',
        no_unread: "You're all caught up!",
        no_notifications_yet: "You don't have any notifications yet.",
        mark_as_read: 'Mark as read',
        unread: 'Unread',
        read: 'Read'
      },

      // Workouts
      workouts: {
        title: 'Workouts',
        my_plan: 'My Workout Plan',
        generate_plan: 'Generate AI Plan',
        start_workout: 'Start Workout',
        complete: 'Complete',
        sets: 'Sets',
        reps: 'Reps',
        rest: 'Rest',
        duration: 'Duration',
        calories_burned: 'Calories Burned'
      },

      // Diet
      diet: {
        title: 'Diet Plans',
        my_plan: 'My Diet Plan',
        generate_plan: 'Generate AI Plan',
        breakfast: 'Breakfast',
        lunch: 'Lunch',
        dinner: 'Dinner',
        snacks: 'Snacks',
        calories: 'Calories',
        protein: 'Protein',
        carbs: 'Carbs',
        fats: 'Fats'
      },

      // Profile
      profile: {
        title: 'Profile',
        personal_info: 'Personal Information',
        health_info: 'Health Information',
        goals: 'Health Goals',
        age: 'Age',
        gender: 'Gender',
        height: 'Height',
        weight: 'Weight',
        activity_level: 'Activity Level',
        diet_type: 'Diet Type'
      },

      // Auth
      auth: {
        login: 'Sign In',
        register: 'Create Account',
        logout: 'Logout',
        email: 'Email',
        password: 'Password',
        forgot_password: 'Forgot password?',
        no_account: "Don't have an account?",
        have_account: 'Already have an account?',
        otp_login: 'OTP Login',
        send_otp: 'Send OTP',
        verify_otp: 'Verify OTP',
        resend_otp: 'Resend OTP'
      },

      // Units
      units: {
        kg: 'kg',
        lbs: 'lbs',
        cm: 'cm',
        ft: 'ft',
        km: 'km',
        mi: 'mi',
        kcal: 'kcal',
        g: 'g',
        ml: 'ml',
        L: 'L'
      },

      // Time
      time: {
        just_now: 'Just now',
        minutes_ago: '{{count}} minutes ago',
        hours_ago: '{{count}} hours ago',
        days_ago: '{{count}} days ago',
        today: 'Today',
        yesterday: 'Yesterday',
        this_week: 'This week'
      }
    }
  },

  hi: {
    translation: {
      // Common
      app_name: 'वाइटलफ्लो',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफल',
      confirm: 'पुष्टि करें',
      back: 'वापस',
      next: 'अगला',
      submit: 'जमा करें',
      search: 'खोजें',
      filter: 'फ़िल्टर',
      all: 'सभी',
      none: 'कोई नहीं',

      // Navigation
      nav: {
        dashboard: 'डैशबोर्ड',
        workouts: 'वर्कआउट',
        exercises: 'व्यायाम लाइब्रेरी',
        diet: 'डाइट प्लान',
        chat: 'AI कोच',
        profile: 'प्रोफाइल',
        settings: 'सेटिंग्स',
        notifications: 'सूचनाएं',
        logout: 'लॉग आउट'
      },

      // Dashboard
      dashboard: {
        welcome: 'वापस स्वागत है',
        health_score: 'स्वास्थ्य स्कोर',
        daily_progress: 'दैनिक प्रगति',
        calories: 'कैलोरी',
        protein: 'प्रोटीन',
        water: 'पानी',
        steps: 'कदम',
        workout_today: 'आज का वर्कआउट',
        no_workout: 'कोई वर्कआउट निर्धारित नहीं',
        view_all: 'सभी देखें',
        quick_actions: 'त्वरित कार्य',
        log_workout: 'वर्कआउट लॉग करें',
        log_meal: 'भोजन लॉग करें',
        track_weight: 'वजन ट्रैक करें',
        ai_insights: 'AI अंतर्दृष्टि'
      },

      // Settings
      settings: {
        title: 'सेटिंग्स',
        subtitle: 'अपनी ऐप प्राथमिकताएं प्रबंधित करें',
        save_changes: 'परिवर्तन सहेजें',
        saved: 'सहेजा गया!',
        saving: 'सहेज रहा है...',

        notifications: 'सूचनाएं',
        email_notifications: 'ईमेल सूचनाएं',
        email_notifications_desc: 'ईमेल द्वारा अपडेट और रिमाइंडर प्राप्त करें',
        push_notifications: 'पुश सूचनाएं',
        push_notifications_desc: 'अपने डिवाइस पर तुरंत सूचनाएं प्राप्त करें',
        weekly_report: 'साप्ताहिक स्वास्थ्य रिपोर्ट',
        weekly_report_desc: 'हर हफ्ते अपनी प्रगति का सारांश प्राप्त करें',
        workout_reminders: 'वर्कआउट रिमाइंडर',
        workout_reminders_desc: 'अपने निर्धारित वर्कआउट की याद दिलाएं',

        phone_number: 'फोन नंबर',
        phone_desc: 'SMS लॉगिन सक्षम करने के लिए अपना फोन नंबर जोड़ें',
        enter_phone: 'फोन नंबर दर्ज करें',
        verify: 'सत्यापित करें',
        verified: 'सत्यापित',
        enter_otp: '6-अंकीय OTP दर्ज करें',

        appearance: 'दिखावट',
        dark_mode: 'डार्क मोड',
        dark_mode_desc: 'एप्लिकेशन के लिए डार्क थीम का उपयोग करें',
        language: 'भाषा',
        language_desc: 'अपनी पसंदीदा भाषा चुनें',
        measurement_units: 'माप इकाइयां',
        measurement_units_desc: 'मेट्रिक या इम्पीरियल इकाइयां चुनें',
        metric: 'मेट्रिक (kg, cm)',
        imperial: 'इम्पीरियल (lbs, ft)',

        privacy_security: 'गोपनीयता और सुरक्षा',
        two_factor: 'दो-कारक प्रमाणीकरण',
        two_factor_desc: 'अपने खाते में सुरक्षा की अतिरिक्त परत जोड़ें',
        data_sharing: 'डेटा साझाकरण',
        data_sharing_desc: 'ऐप को बेहतर बनाने के लिए अनाम डेटा साझा करें',

        danger_zone: 'खतरा क्षेत्र',
        delete_account: 'खाता हटाएं',
        delete_account_desc: 'अपना खाता और सभी डेटा स्थायी रूप से हटाएं',
        delete_confirm: 'यह क्रिया पूर्ववत नहीं की जा सकती। पुष्टि के लिए अपना पासवर्ड दर्ज करें:',
        enter_password: 'अपना पासवर्ड दर्ज करें',
        confirm_delete: 'हटाने की पुष्टि करें',
        deleting: 'हटा रहा है...'
      },

      // Notifications page
      notifications_page: {
        title: 'सूचनाएं',
        unread_count: 'आपके पास {{count}} अपठित सूचना है',
        unread_count_plural: 'आपके पास {{count}} अपठित सूचनाएं हैं',
        all_caught_up: 'सब देख लिया!',
        mark_all_read: 'सभी को पढ़ा चिह्नित करें',
        clear_all: 'सभी साफ करें',
        no_notifications: 'कोई सूचना नहीं',
        no_unread: 'आप अप टू डेट हैं!',
        no_notifications_yet: 'आपके पास अभी कोई सूचना नहीं है।',
        mark_as_read: 'पढ़ा चिह्नित करें',
        unread: 'अपठित',
        read: 'पढ़ा'
      },

      // Auth
      auth: {
        login: 'साइन इन',
        register: 'खाता बनाएं',
        logout: 'लॉग आउट',
        email: 'ईमेल',
        password: 'पासवर्ड',
        forgot_password: 'पासवर्ड भूल गए?',
        no_account: 'खाता नहीं है?',
        have_account: 'पहले से खाता है?',
        otp_login: 'OTP लॉगिन',
        send_otp: 'OTP भेजें',
        verify_otp: 'OTP सत्यापित करें',
        resend_otp: 'OTP पुनः भेजें'
      },

      // Units
      units: {
        kg: 'किग्रा',
        lbs: 'पाउंड',
        cm: 'सेमी',
        ft: 'फीट',
        km: 'किमी',
        mi: 'मील',
        kcal: 'कैलोरी',
        g: 'ग्राम',
        ml: 'मिली',
        L: 'लीटर'
      }
    }
  },

  ta: {
    translation: {
      // Common
      app_name: 'வைட்டல்ஃப்ளோ',
      save: 'சேமி',
      cancel: 'ரத்து',
      delete: 'நீக்கு',
      edit: 'திருத்து',
      loading: 'ஏற்றுகிறது...',
      error: 'பிழை',
      success: 'வெற்றி',
      confirm: 'உறுதிப்படுத்து',
      back: 'பின்',
      next: 'அடுத்து',
      submit: 'சமர்ப்பி',
      search: 'தேடு',
      filter: 'வடிகட்டு',
      all: 'அனைத்தும்',
      none: 'எதுவுமில்லை',

      // Navigation
      nav: {
        dashboard: 'டாஷ்போர்டு',
        workouts: 'பயிற்சிகள்',
        exercises: 'உடற்பயிற்சி நூலகம்',
        diet: 'உணவு திட்டங்கள்',
        chat: 'AI பயிற்சியாளர்',
        profile: 'சுயவிவரம்',
        settings: 'அமைப்புகள்',
        notifications: 'அறிவிப்புகள்',
        logout: 'வெளியேறு'
      },

      // Dashboard
      dashboard: {
        welcome: 'மீண்டும் வரவேற்கிறோம்',
        health_score: 'ஆரோக்கிய மதிப்பெண்',
        daily_progress: 'தினசரி முன்னேற்றம்',
        calories: 'கலோரிகள்',
        protein: 'புரதம்',
        water: 'தண்ணீர்',
        steps: 'படிகள்',
        workout_today: 'இன்றைய பயிற்சி',
        no_workout: 'பயிற்சி திட்டமிடப்படவில்லை',
        view_all: 'அனைத்தையும் காண்க',
        quick_actions: 'விரைவு செயல்கள்',
        log_workout: 'பயிற்சி பதிவு',
        log_meal: 'உணவு பதிவு',
        track_weight: 'எடை கண்காணிப்பு',
        ai_insights: 'AI நுண்ணறிவுகள்'
      },

      // Settings
      settings: {
        title: 'அமைப்புகள்',
        subtitle: 'உங்கள் ஆப் விருப்பங்களை நிர்வகிக்கவும்',
        save_changes: 'மாற்றங்களை சேமி',
        saved: 'சேமிக்கப்பட்டது!',
        saving: 'சேமிக்கிறது...',

        notifications: 'அறிவிப்புகள்',
        email_notifications: 'மின்னஞ்சல் அறிவிப்புகள்',
        email_notifications_desc: 'மின்னஞ்சல் மூலம் புதுப்பிப்புகளை பெறுங்கள்',
        push_notifications: 'புஷ் அறிவிப்புகள்',
        push_notifications_desc: 'உங்கள் சாதனத்தில் உடனடி அறிவிப்புகள் பெறுங்கள்',
        weekly_report: 'வாராந்திர ஆரோக்கிய அறிக்கை',
        weekly_report_desc: 'ஒவ்வொரு வாரமும் உங்கள் முன்னேற்றத்தின் சுருக்கம் பெறுங்கள்',
        workout_reminders: 'பயிற்சி நினைவூட்டல்கள்',
        workout_reminders_desc: 'உங்கள் திட்டமிடப்பட்ட பயிற்சிகளை நினைவூட்டுங்கள்',

        phone_number: 'தொலைபேசி எண்',
        phone_desc: 'SMS உள்நுழைவை இயக்க உங்கள் தொலைபேசி எண்ணைச் சேர்க்கவும்',
        enter_phone: 'தொலைபேசி எண்ணை உள்ளிடவும்',
        verify: 'சரிபார்',
        verified: 'சரிபார்க்கப்பட்டது',
        enter_otp: '6-இலக்க OTP உள்ளிடவும்',

        appearance: 'தோற்றம்',
        dark_mode: 'இருண்ட பயன்முறை',
        dark_mode_desc: 'பயன்பாட்டிற்கு இருண்ட தீம் பயன்படுத்தவும்',
        language: 'மொழி',
        language_desc: 'உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
        measurement_units: 'அளவீட்டு அலகுகள்',
        measurement_units_desc: 'மெட்ரிக் அல்லது இம்பீரியல் அலகுகளைத் தேர்வுசெய்க',
        metric: 'மெட்ரிக் (kg, cm)',
        imperial: 'இம்பீரியல் (lbs, ft)',

        privacy_security: 'தனியுரிமை & பாதுகாப்பு',
        two_factor: 'இரண்டு காரணி அங்கீகாரம்',
        two_factor_desc: 'உங்கள் கணக்கில் கூடுதல் பாதுகாப்பு சேர்க்கவும்',
        data_sharing: 'தரவு பகிர்வு',
        data_sharing_desc: 'ஆப்பை மேம்படுத்த அநாமதேய தரவைப் பகிரவும்',

        danger_zone: 'ஆபத்து மண்டலம்',
        delete_account: 'கணக்கை நீக்கு',
        delete_account_desc: 'உங்கள் கணக்கையும் அனைத்து தரவையும் நிரந்தரமாக நீக்கு',
        delete_confirm: 'இந்த செயலை மாற்ற முடியாது. உறுதிப்படுத்த உங்கள் கடவுச்சொல்லை உள்ளிடவும்:',
        enter_password: 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்',
        confirm_delete: 'நீக்குவதை உறுதிப்படுத்து',
        deleting: 'நீக்குகிறது...'
      },

      // Notifications page
      notifications_page: {
        title: 'அறிவிப்புகள்',
        unread_count: 'உங்களுக்கு {{count}} படிக்காத அறிவிப்பு உள்ளது',
        unread_count_plural: 'உங்களுக்கு {{count}} படிக்காத அறிவிப்புகள் உள்ளன',
        all_caught_up: 'அனைத்தும் பார்த்தாயிற்று!',
        mark_all_read: 'அனைத்தையும் படித்ததாக குறி',
        clear_all: 'அனைத்தையும் அழி',
        no_notifications: 'அறிவிப்புகள் இல்லை',
        no_unread: 'நீங்கள் புதுப்பித்த நிலையில் உள்ளீர்கள்!',
        no_notifications_yet: 'உங்களுக்கு இன்னும் அறிவிப்புகள் இல்லை.',
        mark_as_read: 'படித்ததாக குறி',
        unread: 'படிக்காதது',
        read: 'படித்தது'
      },

      // Auth
      auth: {
        login: 'உள்நுழை',
        register: 'கணக்கு உருவாக்கு',
        logout: 'வெளியேறு',
        email: 'மின்னஞ்சல்',
        password: 'கடவுச்சொல்',
        forgot_password: 'கடவுச்சொல் மறந்துவிட்டதா?',
        no_account: 'கணக்கு இல்லையா?',
        have_account: 'ஏற்கனவே கணக்கு உள்ளதா?',
        otp_login: 'OTP உள்நுழைவு',
        send_otp: 'OTP அனுப்பு',
        verify_otp: 'OTP சரிபார்',
        resend_otp: 'OTP மீண்டும் அனுப்பு'
      },

      // Units
      units: {
        kg: 'கிகி',
        lbs: 'பவுண்ட்',
        cm: 'செமீ',
        ft: 'அடி',
        km: 'கிமீ',
        mi: 'மைல்',
        kcal: 'கலோரி',
        g: 'கிராம்',
        ml: 'மிலி',
        L: 'லிட்டர்'
      }
    }
  },

  fr: {
    translation: {
      // Common
      app_name: 'VitalFlow',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      confirm: 'Confirmer',
      back: 'Retour',
      next: 'Suivant',
      submit: 'Soumettre',
      search: 'Rechercher',
      filter: 'Filtrer',
      all: 'Tous',
      none: 'Aucun',

      // Navigation
      nav: {
        dashboard: 'Tableau de bord',
        workouts: 'Entraînements',
        exercises: "Bibliothèque d'exercices",
        diet: 'Plans de régime',
        chat: 'Coach IA',
        profile: 'Profil',
        settings: 'Paramètres',
        notifications: 'Notifications',
        logout: 'Déconnexion'
      },

      // Dashboard
      dashboard: {
        welcome: 'Bon retour',
        health_score: 'Score de santé',
        daily_progress: 'Progrès quotidien',
        calories: 'Calories',
        protein: 'Protéines',
        water: 'Eau',
        steps: 'Pas',
        workout_today: "Entraînement d'aujourd'hui",
        no_workout: 'Aucun entraînement prévu',
        view_all: 'Voir tout',
        quick_actions: 'Actions rapides',
        log_workout: "Enregistrer l'entraînement",
        log_meal: 'Enregistrer le repas',
        track_weight: 'Suivre le poids',
        ai_insights: 'Insights IA'
      },

      // Settings
      settings: {
        title: 'Paramètres',
        subtitle: "Gérez vos préférences d'application",
        save_changes: 'Enregistrer les modifications',
        saved: 'Enregistré !',
        saving: 'Enregistrement...',

        notifications: 'Notifications',
        email_notifications: 'Notifications par e-mail',
        email_notifications_desc: 'Recevez des mises à jour et des rappels par e-mail',
        push_notifications: 'Notifications push',
        push_notifications_desc: 'Recevez des notifications instantanées sur votre appareil',
        weekly_report: 'Rapport de santé hebdomadaire',
        weekly_report_desc: 'Recevez un résumé de vos progrès chaque semaine',
        workout_reminders: "Rappels d'entraînement",
        workout_reminders_desc: 'Soyez rappelé de vos entraînements programmés',

        phone_number: 'Numéro de téléphone',
        phone_desc: 'Ajoutez votre numéro de téléphone pour activer la connexion SMS',
        enter_phone: 'Entrez le numéro de téléphone',
        verify: 'Vérifier',
        verified: 'Vérifié',
        enter_otp: 'Entrez le code OTP à 6 chiffres',

        appearance: 'Apparence',
        dark_mode: 'Mode sombre',
        dark_mode_desc: "Utilisez le thème sombre pour l'application",
        language: 'Langue',
        language_desc: 'Sélectionnez votre langue préférée',
        measurement_units: 'Unités de mesure',
        measurement_units_desc: 'Choisissez les unités métriques ou impériales',
        metric: 'Métrique (kg, cm)',
        imperial: 'Impérial (lbs, ft)',

        privacy_security: 'Confidentialité et sécurité',
        two_factor: 'Authentification à deux facteurs',
        two_factor_desc: 'Ajoutez une couche de sécurité supplémentaire à votre compte',
        data_sharing: 'Partage de données',
        data_sharing_desc: "Partagez des données anonymisées pour améliorer l'application",

        danger_zone: 'Zone de danger',
        delete_account: 'Supprimer le compte',
        delete_account_desc: 'Supprimez définitivement votre compte et toutes vos données',
        delete_confirm: 'Cette action est irréversible. Veuillez entrer votre mot de passe pour confirmer :',
        enter_password: 'Entrez votre mot de passe',
        confirm_delete: 'Confirmer la suppression',
        deleting: 'Suppression...'
      },

      // Notifications page
      notifications_page: {
        title: 'Notifications',
        unread_count: 'Vous avez {{count}} notification non lue',
        unread_count_plural: 'Vous avez {{count}} notifications non lues',
        all_caught_up: 'Tout est lu !',
        mark_all_read: 'Tout marquer comme lu',
        clear_all: 'Tout effacer',
        no_notifications: 'Pas de notifications',
        no_unread: 'Vous êtes à jour !',
        no_notifications_yet: "Vous n'avez pas encore de notifications.",
        mark_as_read: 'Marquer comme lu',
        unread: 'Non lu',
        read: 'Lu'
      },

      // Auth
      auth: {
        login: 'Se connecter',
        register: 'Créer un compte',
        logout: 'Déconnexion',
        email: 'E-mail',
        password: 'Mot de passe',
        forgot_password: 'Mot de passe oublié ?',
        no_account: "Vous n'avez pas de compte ?",
        have_account: 'Vous avez déjà un compte ?',
        otp_login: 'Connexion OTP',
        send_otp: 'Envoyer OTP',
        verify_otp: 'Vérifier OTP',
        resend_otp: 'Renvoyer OTP'
      },

      // Units
      units: {
        kg: 'kg',
        lbs: 'lbs',
        cm: 'cm',
        ft: 'pi',
        km: 'km',
        mi: 'mi',
        kcal: 'kcal',
        g: 'g',
        ml: 'ml',
        L: 'L'
      }
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

export default i18n
