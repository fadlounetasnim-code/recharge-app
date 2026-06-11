// UI Controller, Translation Engine and Chart Renderers
const UI = (() => {
  let salesChartInstance = null;
  let currentLanguage = localStorage.getItem('rs_lang') || 'fr';

  const getLocalDateStr = (dateInput) => {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  let dashboardStartDate = getLocalDateStr(new Date());
  let dashboardEndDate = getLocalDateStr(new Date());


  const parseClientPayments = (notes) => {
    const match = notes ? notes.match(/\[PMTS:([\s\S]*?)\]/) : null;
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error("Failed to parse client payments JSON:", e);
      }
    }
    return [];
  };

  // --- Localization Dictionary ---
  const TRANSLATIONS = {
    fr: {
      app_title: "Recharge & SIM Manager",
      status_online: "En ligne",
      status_offline: "Hors ligne",
      role_admin: "Admin",
      role_supervisor: "Superviseur",
      role_employee: "Vendeur",
      logout: "Déconnexion",
      
      // Sidebar Navigation
      nav_dashboard: "Tableau de bord",
      nav_clients: "Clients",
      nav_sales: "Ventes",
      nav_stock: "Stock / Articles",
      nav_team: "Équipe",
      nav_reports: "Rapports",
      nav_settings: "Configuration",
      nav_credits: "Crédits Clients",
      credits_subtitle: "Suivi et règlements des ventes à crédit",
      opt_all_credits: "Tous les crédits",
      modal_credit_payment_title: "Enregistrer un Règlement Client",
      lbl_payment_method: "Mode de règlement",
      payment_method_cash: "Espèces",
      payment_method_virement: "Virement bancaire / Versement",
      lbl_initial_paid: "Montant payé initial (DH)",
      lbl_vendeur_destinataire: "Vendeur / Destinataire",
      sellers_stock_matrix_title: "Stock Actuel des Vendeurs",
      btn_transfer_stock: "Transférer Stock",
      modal_stock_transfer_title: "Transfert de Stock",
      lbl_transfer_source: "Source",
      lbl_transfer_dest: "Destination",
      
      // Dashboard KPI Cards
      dashboard_subtitle: "Aperçu de l'activité commerciale en temps réel",
      btn_new_sale: "Nouvelle Vente",
      kpi_recharges_val: "Recharges (Valeur)",
      kpi_sims_val: "Ventes SIM (Valeur)",
      kpi_sims_qty: "Volume SIM (Pcs)",
      chart_sales_title: "Évolution journalière des ventes (Net & Remises)",
      recent_sales_title: "Dernières ventes enregistrées",
      btn_view_all: "Voir tout",

      // Tables headers
      th_date: "Date",
      th_client: "Client",
      th_article: "Article",
      th_quantity: "Quantité",
      th_unit_price: "Prix Unitaire",
      th_gross_total: "Total Brut",
      th_discount: "Remise",
      th_net_total: "Net à Payer",
      th_payment: "Paiement",
      th_actions: "Actions",
      th_vendeur: "Vendeur",
      th_fullname: "Nom Complet",
      th_phone: "Téléphone",
      th_dealer_number: "Numéro Dealer",
      th_activity_type: "Activité",
      th_address: "Adresse",
      th_notes: "Notes",
      th_email: "E-mail",
      th_role: "Rôle",
      th_assigned_sector: "Secteur",
      th_dealer_code: "Code Dealer",
      th_type: "Type",
      summary_clients: "Clients vus :",
      summary_recharges: "Recharges vendues :",
      summary_sims: "SIMs vendues :",

      // Clients View
      clients_subtitle: "Ajouter, rechercher et gérer le portefeuille client",
      btn_new_client: "Nouveau Client",
      btn_import_excel: "Importer Excel / CSV",
      btn_export_clients: "Exporter Clients",
      activity_ag: "AG : Alimentation Générale",
      activity_bt: "BT : Bureau de Tabac",
      activity_lp: "LP : Librairie & Papeterie",
      activity_vpa: "VPA : Vente Portable et Accessoires",
      activity_ky: "KY : Kiosque",
      activity_fs: "FS : Fruits Secs",
      
      // Sales View
      sales_subtitle: "Liste globale de toutes les transactions et facturations",
      btn_export_csv: "Exporter CSV",
      opt_all_payments: "Tous les paiements",
      opt_paid: "Payé",
      opt_unpaid: "Non payé",
      opt_partial: "Partiel",
      opt_all_categories: "Toutes les catégories",
      opt_recharge: "Recharge",
      opt_sim: "Carte SIM",
      opt_pack_sim: "Pack SIM",

      // Stock View
      stock_subtitle: "Inventaire des articles de recharges, cartes SIM et packs",
      btn_adjust_stock: "Ajustement Stock",
      btn_stock_invoice: "Entrée par Facture",
      stock_invoices_title: "Factures d'approvisionnement",
      th_invoice_cost: "Coût Total",
      th_invoice_paid: "Payé",
      th_invoice_balance: "Reste",
      stock_movements_log: "Historique des mouvements de stock",
      opt_stock_in: "Entrée (+)",
      opt_stock_out: "Sortie (-)",
      opt_stock_correction: "Correction",
      opt_stock_supplier_invoice: "Approvisionnement (Facture)",

      // Team View
      team_subtitle: "Gestion des profils de l'équipe (Administrateurs, Superviseurs, Vendeurs)",
      btn_add_member: "Ajouter Collaborateur",
      
      // Reports View
      reports_subtitle: "Rapports journaliers, par secteur et mensuels avec exports",
      btn_export_pdf: "Télécharger PDF",
      lbl_report_type: "Type de Rapport",
      opt_rep_daily: "Journalier par Agent",
      opt_rep_sector: "Secteur géographique",
      opt_rep_monthly: "Mensuel global",
      lbl_date: "Date",
      lbl_month: "Mois",
      lbl_agent: "Agent / Collaborateur",
      lbl_sector: "Secteur",
      opt_all_agents: "Tous les agents",
      rep_sales_volume: "Volume Brut",
      rep_discount_volume: "Remises Accordées",
      rep_net_volume: "Montant Net",
      msg_no_report_data: "Sélectionnez les filtres pour générer le rapport.",

      // Settings View
      settings_subtitle: "Configuration générale du serveur et local storage",
      settings_supabase_title: "Identifiants Supabase",
      btn_save_settings: "Enregistrer & Recharger",
      settings_demo_mode: "Mode Offline / Démo local",
      settings_demo_desc: "Si aucun identifiant Supabase n'est fourni, l'application utilise le stockage local du navigateur (LocalStorage).",
      btn_clear_db: "Effacer la base de données locale",
      lbl_daily_goal: "Objectif Journalier",
      lbl_monthly_recharges_goal: "Objectif Mensuel Recharges (DH)",
      lbl_monthly_sims_goal: "Objectif Mensuel SIM",
      lbl_progress_month_recharges: "Progrès du mois (Recharges DH)",
      lbl_progress_month_sims: "Progrès du mois (SIMs)",
      lbl_progress_daily_net: "Progrès du jour (Net)",
      lbl_sales_goals_title: "Objectifs de Vente",
      lbl_setting_daily_goal: "Objectif Journalier (DH)",
      lbl_setting_monthly_recharges_goal: "Objectif Mensuel Recharges (DH)",
      lbl_setting_monthly_sims_goal: "Objectif Mensuel SIM (Unités)",
      btn_save_goals: "Enregistrer les objectifs",

      // Modals General
      btn_cancel: "Annuler",
      btn_save: "Enregistrer",
      modal_new_client_title: "Nouveau Client",
      modal_import_preview_title: "Aperçu de l'importation",
      btn_confirm_import: "Confirmer l'importation",
      modal_new_team_title: "Nouveau Collaborateur",
      modal_stock_invoice_title: "Nouvel Approvisionnement (Facture)",
      modal_edit_stock_invoice_title: "Modifier la Facture d'approvisionnement",
      modal_invoice_details_title: "Détails de la Facture",
      modal_supplier_payment_title: "Règlement Facture Approvisionnement",
      modal_payment_photo_title: "Reçu du Virement",
      lbl_invoice_number: "Numéro de Facture",
      lbl_client_assignee: "Vendeur / Assigné",
      lbl_quantities_by_article: "Quantités par article",
      lbl_payment_amount: "Montant du Règlement (DH)",
      lbl_payment_photo: "Photo du Virement / Reçu",
      lbl_payments_list: "Règlements Effectués",
      lbl_gross_invoice: "Total Brut",
      lbl_net_invoice: "Coût Net",
      th_invoice_number: "N° Facture",
      th_invoice_items_count: "Articles",
      th_receipt: "Reçu",
      modal_new_sale_title: "Vente Recharge & SIM",
      modal_receipt_title: "Reçu Client",
      opt_disc_none: "Aucune",
      opt_disc_percent: "Pourcentage (%)",
      opt_disc_fixed: "Montant fixe (DH)",
      lbl_discount_type: "Type de remise",
      lbl_discount_value: "Valeur de la remise",
      total_gross_label: "Total Brut",
      discount_amount_label: "Montant Remise",
      total_net_label: "Total Net",
      btn_close: "Fermer",
      btn_print: "Imprimer / PDF",

      // Messages & Toast alerts
      msg_save_success: "Enregistré avec succès !",
      msg_delete_success: "Supprimé avec succès !",
      msg_insufficient_stock: "Stock insuffisant !",
      msg_login_failed: "Connexion échouée. Identifiants invalides.",
      msg_access_denied: "Accès refusé !",
      msg_confirm_delete: "Êtes-vous sûr de vouloir supprimer cet élément ?",
      msg_confirm_clear_db: "Voulez-vous vraiment effacer TOUTES les données locales ?",
      msg_confirm_pay_credit: "Êtes-vous sûr de vouloir marquer cette vente comme entièrement payée ?",
      opt_sim_mode_simple: "Saisie Simple",
      opt_sim_mode_serial: "Numéros de Série",
      opt_sim_mode_colisage: "Colisage",
      label_sim_qty_calculated: "Quantité :",
      settings_change_password_title: "Modifier le mot de passe",
      label_old_password: "Ancien mot de passe",
      label_new_password: "Nouveau mot de passe",
      label_confirm_password: "Confirmer le nouveau mot de passe",
      btn_change_password: "Modifier le mot de passe"
    },
    ar: {
      app_title: "مدير الشحن والبطاقات",
      status_online: "متصل",
      status_offline: "غير متصل",
      role_admin: "مدير",
      role_supervisor: "مشرف",
      role_employee: "موظف مبيعات",
      logout: "تسجيل الخروج",
      
      // Sidebar Navigation
      nav_dashboard: "لوحة التحكم",
      nav_clients: "العملاء",
      nav_sales: "المبيعات",
      nav_stock: "المخزون والسلع",
      nav_team: "فريق العمل",
      nav_reports: "التقارير",
      nav_settings: "الإعدادات",
      nav_credits: "ديون العملاء",
      credits_subtitle: "متابعة وتسوية المبيعات بالكريدي",
      opt_all_credits: "جميع الديون",
      modal_credit_payment_title: "تسجيل دفعة زبون",
      lbl_payment_method: "طريقة الدفع",
      payment_method_cash: "نقداً",
      payment_method_virement: "تحويل أو إيداع بنكي",
      lbl_initial_paid: "المبلغ المدفوع أولياً (درهم)",
      lbl_vendeur_destinataire: "الموزع / البائع المستلم",
      sellers_stock_matrix_title: "مخزون الباعة الحالي",
      btn_transfer_stock: "نقل المخزون",
      modal_stock_transfer_title: "نقل المخزون",
      lbl_transfer_source: "المصدر",
      lbl_transfer_dest: "الوجهة",
      
      // Dashboard KPI Cards
      dashboard_subtitle: "متابعة شاملة للمبيعات والمخزون في الوقت الفعلي",
      btn_new_sale: "عملية بيع جديدة",
      kpi_recharges_val: "مبيعات التعبئة (قيمة)",
      kpi_sims_val: "مبيعات SIM (قيمة)",
      kpi_sims_qty: "مبيعات SIM (حجم)",
      chart_sales_title: "تطور المبيعات اليومية (الصافي والخصم)",
      recent_sales_title: "آخر المبيعات المسجلة",
      btn_view_all: "عرض الكل",

      // Tables headers
      th_date: "التاريخ",
      th_client: "العميل",
      th_article: "السلعة",
      th_quantity: "الكمية",
      th_unit_price: "سعر الوحدة",
      th_gross_total: "الإجمالي",
      th_discount: "الخصم",
      th_net_total: "الصافي المطلوب",
      th_payment: "حالة الدفع",
      th_actions: "الإجراءات",
      th_vendeur: "البائع",
      th_fullname: "الاسم الكامل",
      th_phone: "رقم الهاتف",
      th_dealer_number: "رقم Dealer",
      th_activity_type: "النشاط",
      th_address: "العنوان",
      th_notes: "ملاحظات",
      th_email: "البريد الإلكتروني",
      th_role: "الدور",
      th_assigned_sector: "القطاع",
      th_dealer_code: "كود Dealer",
      th_type: "النوع",
      summary_clients: "الزبائن الذين تمت زيارتهم :",
      summary_recharges: "التعبئات المباعة :",
      summary_sims: "بطاقات SIM المباعة :",

      // Clients View
      clients_subtitle: "إضافة، بحث وإدارة محفظة زبائن الوكالة",
      btn_new_client: "زبون جديد",
      btn_import_excel: "استيراد Excel / CSV",
      btn_export_clients: "تصدير الزبناء",
      activity_ag: "AG : مواد غذائية عامة",
      activity_bt: "BT : كشك تبغ",
      activity_lp: "LP : مكتبة / خدمات",
      activity_vpa: "VPA : بيع الهواتف والملحقات",
      activity_ky: "KY : كشك",
      activity_fs: "FS : فواكه جافة",
      
      // Sales View
      sales_subtitle: "السجل الشامل لكل عمليات الفوترة والمبيعات الصادرة",
      btn_export_csv: "تصدير CSV",
      opt_all_payments: "جميع حالات الدفع",
      opt_paid: "مدفوعة",
      opt_unpaid: "غير مدفوعة",
      opt_partial: "مدفوعة جزئياً",
      opt_all_categories: "جميع الأصناف",
      opt_recharge: "تعبئة شحن",
      opt_sim: "بطاقة SIM",
      opt_pack_sim: "حزمة SIM",

      // Stock View
      stock_subtitle: "سجل المواد المتوفرة في المخازن ومبيعات التجزئة والكل",
      btn_adjust_stock: "تعديل المخزون",
      btn_stock_invoice: "إدخال بالفاتورة",
      stock_invoices_title: "فواتير التوريد",
      th_invoice_cost: "التكلفة الإجمالية",
      th_invoice_paid: "المدفوع",
      th_invoice_balance: "المتبقي",
      stock_movements_log: "سجل حركات المخزون الصادرة والواردة",
      opt_stock_in: "وارد (+)",
      opt_stock_out: "صادر (-)",
      opt_stock_correction: "تصحيح",
      opt_stock_supplier_invoice: "شحنة توريد (فاتورة)",

      // Team View
      team_subtitle: "إدارة حسابات فريق العمل (مدير، مشرف، موظف مبيعات)",
      btn_add_member: "إضافة متعاون",
      
      // Reports View
      reports_subtitle: "تقارير يومية، دورية وحسب القطاع مع إمكانيات التصدير",
      btn_export_pdf: "تحميل PDF",
      lbl_report_type: "نوع التقرير",
      opt_rep_daily: "يومي حسب المندوب",
      opt_rep_sector: "حسب القطاع الجغرافي",
      opt_rep_monthly: "شهري شامل",
      lbl_date: "التاريخ",
      lbl_month: "الشهر",
      lbl_agent: "المندوب / الموظف",
      lbl_sector: "القطاع",
      opt_all_agents: "جميع الموظفين",
      rep_sales_volume: "الحجم الإجمالي",
      rep_discount_volume: "قيمة الخصومات",
      rep_net_volume: "المبلغ الصافي",
      msg_no_report_data: "يرجى تحديد مرشحات البحث لعرض التقرير.",

      // Settings View
      settings_subtitle: "إعدادات الاتصال والتهيئة البرمجية للنظام",
      settings_supabase_title: "بيانات Supabase",
      btn_save_settings: "حفظ وإعادة تحميل",
      settings_demo_mode: "وضع العمل المحلي دون إنترنت",
      settings_demo_desc: "إذا لم يتم إدخال بيانات Supabase، سيقوم النظام بالعمل محلياً وحفظ البيانات في متصفحك.",
      btn_clear_db: "مسح جميع البيانات المحلية",
      lbl_daily_goal: "الهدف اليومي",
      lbl_monthly_recharges_goal: "الهدف الشهري للتعبئات (درهم)",
      lbl_monthly_sims_goal: "الهدف الشهري لبطاقات SIM",
      lbl_progress_month_recharges: "التقدم الشهري (التعبئات درهم)",
      lbl_progress_month_sims: "التقدم الشهري (البطاقات)",
      lbl_progress_daily_net: "تقدم اليوم (الصافي)",
      lbl_sales_goals_title: "أهداف المبيعات",
      lbl_setting_daily_goal: "الهدف اليومي (درهم)",
      lbl_setting_monthly_recharges_goal: "الهدف الشهري للتعبئات (درهم)",
      lbl_setting_monthly_sims_goal: "الهدف الشهري لبطاقات SIM (قطع)",
      btn_save_goals: "حفظ الأهداف",
      modal_stock_invoice_title: "شحنة مخزون جديدة (فاتورة)",
      modal_edit_stock_invoice_title: "تعديل فاتورة التوريد",
      modal_invoice_details_title: "تفاصيل الفاتورة",
      modal_supplier_payment_title: "تسجيل دفعة جديدة للفاتورة",
      modal_payment_photo_title: "وصل التحويل البنكي",
      lbl_invoice_number: "رقم الفاتورة",
      lbl_client_assignee: "البائع / المعين له",
      lbl_quantities_by_article: "الكميات حسب السلعة",
      lbl_payment_amount: "قيمة الدفعة (درهم)",
      lbl_payment_photo: "صورة التحويل / الوصل",
      lbl_payments_list: "الدفعات المسجلة",
      lbl_gross_invoice: "الإجمالي قبل الخصم",
      lbl_net_invoice: "التكلفة الصافية",
      th_invoice_number: "رقم الفاتورة",
      th_invoice_items_count: "السلع",
      th_receipt: "الوصل",
      modal_new_client_title: "زبون جديد",
      modal_import_preview_title: "معاينة الاستيراد",
      btn_confirm_import: "تأكيد الاستيراد",
      msg_confirm_pay_credit: "هل أنت متأكد من رغبتك في تحديد هذه البيعة كمدفوعة بالكامل؟",
      opt_sim_mode_simple: "إدخال بسيط",
      opt_sim_mode_serial: "الأرقام التسلسلية",
      opt_sim_mode_colisage: "التعبئة (Colisage)",
      label_sim_qty_calculated: "الكمية :",
      settings_change_password_title: "تغيير كلمة المرور",
      label_old_password: "كلمة المرور القديمة",
      label_new_password: "كلمة المرور الجديدة",
      label_confirm_password: "تأكيد كلمة المرور الجديدة",
      btn_change_password: "تعديل كلمة المرور"
    }
  };

  // --- Page Transitions Router ---
  const showView = (viewId) => {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
      view.style.display = 'none';
    });

    // Show selected view
    const activeView = document.getElementById(`view-${viewId}`);
    if (activeView) {
      activeView.classList.add('active');
      activeView.style.display = 'block';
    }

    // Update active state in sidebar navigation
    document.querySelectorAll('[data-nav]').forEach(item => {
      if (item.getAttribute('data-nav') === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Lazy load dashboards/metrics
    if (viewId === 'dashboard') {
      initDashboard();
      setTimeout(() => {
        if (window.dashboardMapInstance) {
          window.dashboardMapInstance.invalidateSize();
        }
      }, 150);
    } else if (viewId === 'clients') {
      refreshClients();
    } else if (viewId === 'sales') {
      refreshSales();
    } else if (viewId === 'stock') {
      refreshStock();
    } else if (viewId === 'team') {
      refreshTeam();
    } else if (viewId === 'reports') {
      updateReportFilters();
    } else if (viewId === 'credits') {
      refreshCredits();
    }
  };

  // --- Page Translation logic ---
  const translatePage = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = TRANSLATIONS[currentLanguage][key];
      if (val) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = val;
        } else {
          el.textContent = val;
        }
      }
    });

    // Set page HTML dir
    const htmlEl = document.documentElement;
    if (currentLanguage === 'ar') {
      htmlEl.setAttribute('lang', 'ar');
      htmlEl.setAttribute('dir', 'rtl');
    } else {
      htmlEl.setAttribute('lang', 'fr');
      htmlEl.setAttribute('dir', 'ltr');
    }
  };

  const getTranslation = (key) => {
    return TRANSLATIONS[currentLanguage][key] || key;
  };

  const switchLanguage = (lang) => {
    currentLanguage = lang;
    localStorage.setItem('rs_lang', lang);
    
    // Toggle active buttons CSS classes
    document.getElementById('lang-fr').classList.toggle('active', lang === 'fr');
    document.getElementById('lang-ar').classList.toggle('active', lang === 'ar');
    
    translatePage();
    
    // Refresh current view to translate dynamic contents
    const activeNav = document.querySelector('.sidebar .active');
    if (activeNav) {
      showView(activeNav.getAttribute('data-nav'));
    }
  };

  const toggleTheme = () => {
    const isLight = document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme', !isLight);
    localStorage.setItem('rs_theme', isLight ? 'light' : 'dark');
  };

  // Set initial theme
  if (localStorage.getItem('rs_theme') === 'light') {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  } else {
    document.body.classList.add('dark-theme');
  }

  // --- Toast Notifications Engine ---
  const showToast = (messageKeyOrText, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const text = TRANSLATIONS[currentLanguage][messageKeyOrText] || messageKeyOrText;
    
    const toast = document.createElement('div');
    const toastClass = type === 'success' ? 'success' : type === 'error' ? 'error' : 'info';
    toast.className = `toast ${toastClass}`;

    let dotColor = 'var(--info)';
    if (type === 'success') dotColor = 'var(--success)';
    if (type === 'error') dotColor = 'var(--crimson)';

    toast.innerHTML = `
      <span class="dot" style="background-color: ${dotColor};"></span>
      <span>${text}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // --- Render Dashboard Analytics Charts & KPIs ---
  const initDashboard = async () => {
    try {
      const sales = await DB.getSales();
      const articles = await DB.getArticles();
      const user = Auth.getUserProfile();
      const userRole = Auth.getUserRole();

      // Populate seller filter dropdown for Admin/Supervisor
      const filterSelect = document.getElementById('dashboard-filter-vendeur');
      if (filterSelect) {
        if (userRole === 'admin' || userRole === 'supervisor') {
          filterSelect.style.display = 'block';
          if (filterSelect.children.length <= 1) {
            const team = await DB.getTeamMembers();
            const sellers = team.filter(t => t.role === 'employee' && t.is_active);
            sellers.forEach(s => {
              const opt = document.createElement('option');
              opt.value = s.id;
              opt.textContent = s.full_name;
              filterSelect.appendChild(opt);
            });
          }
        } else {
          filterSelect.style.display = 'none';
        }
      }

      const selectedSeller = filterSelect ? filterSelect.value : 'all';

      // Calculate totals
      let rechargesVal = 0;
      let simsVal = 0;
      let simsQty = 0;
      
      // Filter sales by permission, selected seller AND date range
      const filteredSales = sales.filter(s => {
        let matchesSeller = false;
        if (userRole === 'admin' || userRole === 'supervisor') {
          if (selectedSeller !== 'all') {
            matchesSeller = s.employee_id === selectedSeller;
          } else {
            matchesSeller = true;
          }
        } else {
          matchesSeller = s.employee_id === user.id;
        }

        if (!matchesSeller) return false;

        const saleDate = getLocalDateStr(s.created_at);
        return saleDate >= dashboardStartDate && saleDate <= dashboardEndDate;
      });

      filteredSales.forEach(sale => {
        // Find article category
        const art = articles.find(a => a.id === sale.article_id);
        if (art) {
          if (art.category === 'recharge') {
            rechargesVal += Number(sale.net_total) || 0;
          } else if (art.category === 'sim' || art.category === 'pack_sim') {
            simsVal += Number(sale.net_total) || 0;
            simsQty += Number(sale.quantity) || 0;
          }
        }
      });

      // Update dashboard labels
      const firstCardTitle = document.querySelector('.metrics-grid .metric-card:nth-child(1) h3');
      const secondCardTitle = document.querySelector('.metrics-grid .metric-card:nth-child(2) h3');
      const thirdCardTitle = document.querySelector('.metrics-grid .metric-card:nth-child(3) h3');
      const isArabic = currentLanguage === 'ar';

      // Update KPI card contents
      const kpiRechargesVal = document.getElementById('kpi-recharges-val');
      const kpiSimsVal = document.getElementById('kpi-sims-val');
      const kpiSimsQty = document.getElementById('kpi-sims-qty');

      if (kpiRechargesVal) kpiRechargesVal.textContent = `${rechargesVal.toFixed(2)} DH`;
      if (kpiSimsVal) kpiSimsVal.textContent = `${simsVal.toFixed(2)} DH`;
      if (kpiSimsQty) kpiSimsQty.textContent = `${simsQty} Pcs`;

      if (userRole === 'employee') {
        if (firstCardTitle) firstCardTitle.textContent = isArabic ? 'مبيعاتي من التعبئة (قيمة)' : 'Mes Recharges (Valeur)';
        if (secondCardTitle) secondCardTitle.textContent = isArabic ? 'مبيعاتي من SIM (قيمة)' : 'Mes SIM (Valeur)';
        if (thirdCardTitle) thirdCardTitle.textContent = isArabic ? 'مبيعاتي من SIM (حجم)' : 'Mes SIM (Volume)';
        
        let sellerTotalStock = 0;
        const quickStockBody = document.getElementById('seller-quick-stock-body');
        if (quickStockBody) quickStockBody.innerHTML = '';
        
        for (const art of articles) {
          const stock = await DB.getSellerStock(user.id, art.id);
          sellerTotalStock += stock;
          
          if (quickStockBody) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td style="padding: 4px 8px;"><strong>${art.name}</strong></td>
              <td style="padding: 4px 8px; font-weight: 700; color: ${stock < 10 ? 'var(--crimson)' : 'var(--success)'};" class="text-right">${stock} Pcs</td>
            `;
            quickStockBody.appendChild(tr);
          }
        }

        const widgets = document.getElementById('employee-dashboard-widgets');
        if (widgets) {
          widgets.style.display = 'grid';
          
          // Compute monthly stats for goals (using raw sales to ensure full-month calculation)
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          
          const currentMonthSales = sales.filter(s => {
            const d = new Date(s.created_at);
            if (s.employee_id !== user.id) return false;
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          });

          let monthlyRechargesDH = 0;
          let monthlySimsVolume = 0;

          currentMonthSales.forEach(sale => {
            const art = articles.find(a => a.id === sale.article_id);
            if (art) {
              if (art.category === 'recharge') {
                monthlyRechargesDH += (Number(sale.net_total) || 0);
              } else if (art.category === 'sim' || art.category === 'pack_sim') {
                monthlySimsVolume += sale.quantity;
              }
            }
          });
          
          // 1. Monthly Recharges Goal (DH)
          const rechargesTarget = parseFloat(user.monthly_recharges_goal) ||
                                  parseFloat(localStorage.getItem('rs_goal_recharges_' + user.id)) || 
                                  parseFloat(localStorage.getItem('rs_monthly_recharges_goal')) || 
                                  5000.00;
          const pctRecharges = Math.min(100, (monthlyRechargesDH / rechargesTarget) * 100);
          document.getElementById('seller-monthly-recharges-text').textContent = `${monthlyRechargesDH.toFixed(2)} / ${rechargesTarget.toFixed(2)} DH`;
          document.getElementById('seller-monthly-recharges-bar').style.width = `${pctRecharges}%`;
          document.getElementById('seller-monthly-recharges-status').textContent = pctRecharges >= 100
            ? (isArabic ? 'تهانينا! حققت هدف التعبئات الشهري 🎉' : 'Félicitations ! Objectif de recharges mensuel atteint 🎉')
            : (isArabic ? `متبقي ${(rechargesTarget - monthlyRechargesDH).toFixed(2)} درهم لتحقيق الهدف` : `Encore ${(rechargesTarget - monthlyRechargesDH).toFixed(2)} DH pour atteindre l'objectif`);

          // 2. Monthly SIMs Goal (Pcs)
          const simsTarget = parseInt(user.monthly_sims_goal, 10) ||
                             parseInt(localStorage.getItem('rs_goal_sims_' + user.id), 10) || 
                             parseInt(localStorage.getItem('rs_monthly_sims_goal'), 10) || 
                             100;
          const pctSims = Math.min(100, (monthlySimsVolume / simsTarget) * 100);
          document.getElementById('seller-monthly-sims-text').textContent = `${monthlySimsVolume} / ${simsTarget} Pcs`;
          document.getElementById('seller-monthly-sims-bar').style.width = `${pctSims}%`;
          document.getElementById('seller-monthly-sims-status').textContent = pctSims >= 100
            ? (isArabic ? 'تهانينا! حققت هدف البطاقات الشهري 🎉' : 'Félicitations ! Objectif de SIM mensuel atteint 🎉')
            : (isArabic ? `متبقي ${simsTarget - monthlySimsVolume} بطاقة لتحقيق الهدف` : `Encore ${simsTarget - monthlySimsVolume} Pcs pour atteindre l'objectif`);
        }
      } else {
        if (firstCardTitle) firstCardTitle.textContent = getTranslation('kpi_recharges_val');
        if (secondCardTitle) secondCardTitle.textContent = getTranslation('kpi_sims_val');
        if (thirdCardTitle) thirdCardTitle.textContent = getTranslation('kpi_sims_qty');

        const widgets = document.getElementById('employee-dashboard-widgets');
        if (widgets) widgets.style.display = 'none';
      }

      // Render recent sales
      const tbody = document.getElementById('dashboard-recent-sales-body');
      tbody.innerHTML = '';
      
      const recentSales = filteredSales.slice(0, 5);
      if (recentSales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">${getTranslation('msg_no_report_data')}</td></tr>`;
      } else {
        recentSales.forEach(sale => {
          const discountStr = sale.discount_type === 'percentage' 
            ? `${sale.discount_value}% (${sale.discount_amount} DH)` 
            : sale.discount_type === 'fixed' 
              ? `${sale.discount_value} DH` 
              : '-';

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${new Date(sale.created_at).toLocaleDateString()}</td>
            <td><strong>${sale.clients?.full_name || 'Client'}</strong></td>
            <td>${sale.articles?.name || 'Recharge'}</td>
            <td>${sale.quantity}</td>
            <td>${Number(sale.gross_total).toFixed(2)} DH</td>
            <td class="text-amber">${discountStr}</td>
            <td class="text-success" style="font-weight:700;">${Number(sale.net_total).toFixed(2)} DH</td>
            <td><span class="badge ${sale.payment_status === 'paid' ? 'badge-success' : sale.payment_status === 'unpaid' ? 'badge-crimson' : 'badge-amber'}">${getTranslation('opt_' + sale.payment_status)}</span></td>
            <td class="text-right">
              <button class="btn btn-outline btn-sm" onclick="showReceipt('${sale.id}')" title="Ticket">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              </button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }

      // Draw Daily Sales Chart
      drawSalesChart(filteredSales);

      // Draw Client Map
      await initDashboardMap();

    } catch (e) {
      console.error('Failed to load dashboard:', e);
    }
  };

  const initDashboardMap = async () => {
    const mapDiv = document.getElementById('dashboard-map');
    if (!mapDiv) return;

    try {
      const clients = await DB.getClients();
      const role = Auth.getUserRole();
      const user = Auth.getUserProfile();
      let filteredClients = clients;
      if (role === 'employee' && user) {
        filteredClients = clients.filter(c => c.created_by === user.id);
      }
      
      const clientsWithGPS = filteredClients.filter(c => c.latitude && c.longitude);

      if (window.dashboardMapInstance) {
        window.dashboardMapInstance.remove();
        window.dashboardMapInstance = null;
      }

      const isLightTheme = document.body.classList.contains('light-theme');
      const tilesUrl = isLightTheme 
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

      if (clientsWithGPS.length === 0) {
        const defaultCenter = [35.17, -2.93]; // Nador region
        const map = L.map('dashboard-map').setView(defaultCenter, 11);
        L.tileLayer(tilesUrl, {
          attribution: '&copy; OpenStreetMap &copy; CARTO'
        }).addTo(map);
        window.dashboardMapInstance = map;
        return;
      }

      const bounds = [];
      clientsWithGPS.forEach(c => {
        bounds.push([parseFloat(c.latitude), parseFloat(c.longitude)]);
      });

      const map = L.map('dashboard-map');
      L.tileLayer(tilesUrl, {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      map.fitBounds(bounds, { padding: [30, 30] });
      if (map.getZoom() > 15) {
        map.setZoom(15);
      }

      const isArabic = currentLanguage === 'ar';
      const primaryColor = isLightTheme ? '#831cb5' : '#c346ff';

      clientsWithGPS.forEach(c => {
        const actType = c.activity_type ? c.activity_type.toLowerCase() : '';
        const actLabel = actType ? (getTranslation('activity_' + actType) || c.activity_type) : '-';
        
        const popupHtml = `
          <div style="font-family: ${isArabic ? 'Cairo, sans-serif' : 'Inter, sans-serif'}; color: var(--text-primary); padding: 4px; font-size: 0.85rem; min-width: 180px;">
            <strong style="font-size: 0.95rem; display: block; margin-bottom: 6px; color: var(--primary);">${c.full_name}</strong>
            <div style="margin-bottom: 4px;"><strong>${isArabic ? 'الهاتف:' : 'Tél:'}</strong> ${c.phone_number || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>${isArabic ? 'رقم التاجر:' : 'Dealer:'}</strong> <span class="badge badge-info" style="font-size:0.7rem; padding: 2px 6px;">${c.dealer_number}</span></div>
            <div style="margin-bottom: 8px;"><strong>${isArabic ? 'النشاط:' : 'Activité:'}</strong> ${actLabel}</div>
            <a href="https://www.google.com/maps?q=${c.latitude},${c.longitude}" target="_blank" class="btn btn-primary btn-sm" style="display: flex; width: 100%; color: #fff !important; text-decoration: none; justify-content: center; align-items: center; gap: 4px; padding: 6px; border-radius: 4px; font-weight: 600; font-size: 0.75rem; background-color: var(--primary);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px;"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
              ${isArabic ? 'الاتجاهات (Google Maps)' : 'Itinéraire (Google Maps)'}
            </a>
          </div>
        `;

        const marker = L.circleMarker([parseFloat(c.latitude), parseFloat(c.longitude)], {
          radius: 9,
          fillColor: primaryColor,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map);

        marker.bindTooltip(c.full_name, {
          permanent: false,
          direction: 'top',
          className: 'map-tooltip'
        });

        marker.bindPopup(popupHtml);
      });

      window.dashboardMapInstance = map;
    } catch (err) {
      console.error('Failed to init dashboard map:', err);
    }

    setTimeout(() => {
      if (window.dashboardMapInstance) {
        window.dashboardMapInstance.invalidateSize();
      }
    }, 100);
  };

  // Draw chart of daily profits/remises
  const drawSalesChart = (sales) => {
    const canvas = document.getElementById('sales-trend-chart');
    if (!canvas) return;

    // Helper to safely add alpha opacity to theme-aware CSS colors
    const getRgbaColor = (colorStr, alpha) => {
      const clean = colorStr.trim();
      if (clean.startsWith('#')) {
        const hex = clean.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      if (clean.startsWith('rgb')) {
        if (clean.startsWith('rgba')) {
          return clean.replace(/[^,]+(?=\))/, ` ${alpha}`);
        }
        return clean.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
      }
      return clean;
    };

    // Group sales by date
    const dailyData = {};
    sales.slice().reverse().forEach(sale => {
      const dateStr = new Date(sale.created_at).toLocaleDateString();
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { net: 0, discount: 0 };
      }
      dailyData[dateStr].net += Number(sale.net_total) || 0;
      dailyData[dateStr].discount += Number(sale.discount_amount) || 0;
    });

    // Generate last 7 days to draw a premium continuous timeline
    const labels = [];
    const netValues = [];
    const discountValues = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString();
      labels.push(dateStr);
      
      const dayData = dailyData[dateStr] || { net: 0, discount: 0 };
      netValues.push(dayData.net);
      discountValues.push(dayData.discount);
    }

    if (salesChartInstance) {
      salesChartInstance.destroy();
    }

    const isArabic = currentLanguage === 'ar';
    const computedStyle = getComputedStyle(document.body);
    const primaryColor = computedStyle.getPropertyValue('--primary').trim() || '#831cb5';
    const textPrimaryColor = computedStyle.getPropertyValue('--text-primary').trim() || '#4a0c70';
    const textSecondaryColor = computedStyle.getPropertyValue('--text-secondary').trim() || '#7b5b9c';
    const gridColor = document.body.classList.contains('light-theme') ? 'rgba(129, 30, 193, 0.08)' : 'rgba(255, 255, 255, 0.08)';

    // Create Canvas Gradients
    const ctx = canvas.getContext('2d');
    
    const gradientNet = ctx.createLinearGradient(0, 0, 0, 300);
    gradientNet.addColorStop(0, getRgbaColor(primaryColor, 0.35)); 
    gradientNet.addColorStop(1, getRgbaColor(primaryColor, 0.0)); 

    const gradientDiscount = ctx.createLinearGradient(0, 0, 0, 300);
    gradientDiscount.addColorStop(0, 'rgba(251, 146, 60, 0.25)'); // Orange
    gradientDiscount.addColorStop(1, 'rgba(251, 146, 60, 0.0)'); 

    salesChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: isArabic ? 'مبيعات صافية (DH)' : 'Chiffre Net (DH)',
            data: netValues,
            borderColor: primaryColor,
            backgroundColor: gradientNet,
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: primaryColor,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: primaryColor,
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2
          },
          {
            label: isArabic ? 'مجموع التخفيضات (DH)' : 'Remises Accordées (DH)',
            data: discountValues,
            borderColor: '#fb923c',
            backgroundColor: gradientDiscount,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#fb923c',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#fb923c',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textPrimaryColor,
              font: {
                family: isArabic ? 'Cairo, sans-serif' : 'Inter, sans-serif',
                size: 12,
                weight: '600'
              },
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: document.body.classList.contains('light-theme') ? '#ffffff' : '#1e293b',
            titleColor: textPrimaryColor,
            bodyColor: textPrimaryColor,
            borderColor: document.body.classList.contains('light-theme') ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              family: isArabic ? 'Cairo, sans-serif' : 'Inter, sans-serif',
              size: 12,
              weight: 'bold'
            },
            bodyFont: {
              family: isArabic ? 'Cairo, sans-serif' : 'Inter, sans-serif',
              size: 12
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textSecondaryColor,
              font: {
                family: isArabic ? 'Cairo, sans-serif' : 'Inter, sans-serif',
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: gridColor,
              drawBorder: false,
              borderDash: [4, 4]
            },
            ticks: {
              color: textSecondaryColor,
              font: {
                family: isArabic ? 'Cairo, sans-serif' : 'Inter, sans-serif',
                size: 11
              }
            }
          }
        }
      }
    });
  };



  // --- Render Tables & Grids ---
  const refreshClients = async () => {
    const clients = await DB.getClients();
    const tbody = document.getElementById('clients-table-body');
    tbody.innerHTML = '';

    const role = Auth.getUserRole();
    const user = Auth.getUserProfile();

    // Reset select-all checkbox and hide bulk bar
    const selectAllChk = document.getElementById('client-select-all');
    if (selectAllChk) selectAllChk.checked = false;
    const bulkBar = document.getElementById('clients-bulk-bar');
    if (bulkBar) bulkBar.style.display = 'none';

    // Populate filter-vendeur and select boxes
    const filterSelect = document.getElementById('client-filter-vendeur');
    const bulkSelect = document.getElementById('client-select-by-vendeur');
    const bulkAssignSelect = document.getElementById('bulk-assign-vendeur');
    
    if (role === 'admin' || role === 'supervisor') {
      const team = await DB.getTeamMembers();
      const sellers = team.filter(t => t.role === 'employee' || t.role === 'supervisor' || t.role === 'admin');
      
      if (filterSelect) {
        const currentFilterValue = filterSelect.value || 'all';
        filterSelect.innerHTML = `
          <option value="all">Tous les vendeurs</option>
          <option value="none">Non assigné</option>
          ${sellers.map(s => `<option value="${s.id}">${s.full_name}</option>`).join('')}
        `;
        filterSelect.value = currentFilterValue;
        filterSelect.style.display = 'block';
      }
      
      if (bulkSelect) {
        bulkSelect.innerHTML = `
          <option value="">-- Sélectionner --</option>
          <option value="none">Non assignés</option>
          ${sellers.map(s => `<option value="${s.id}">${s.full_name}</option>`).join('')}
        `;
      }
      
      if (bulkAssignSelect) {
        bulkAssignSelect.innerHTML = `
          <option value="">-- Assigner à --</option>
          <option value="none">Laisser vide / Non assigné</option>
          ${sellers.map(s => `<option value="${s.id}">${s.full_name}</option>`).join('')}
        `;
      }
      
      const selectBySellerCont = document.getElementById('bulk-select-by-seller-container');
      if (selectBySellerCont) selectBySellerCont.style.display = 'inline-flex';
      const assignCont = document.getElementById('bulk-assign-container');
      if (assignCont) assignCont.style.display = 'inline-flex';
      const deleteBtn = document.getElementById('bulk-delete-btn');
      if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    } else {
      if (filterSelect) filterSelect.style.display = 'none';
      const selectBySellerCont = document.getElementById('bulk-select-by-seller-container');
      if (selectBySellerCont) selectBySellerCont.style.display = 'none';
      const assignCont = document.getElementById('bulk-assign-container');
      if (assignCont) assignCont.style.display = 'none';
      const deleteBtn = document.getElementById('bulk-delete-btn');
      if (deleteBtn) deleteBtn.style.display = 'none';
    }

    let filteredClients = clients;
    if (role === 'employee' && user) {
      filteredClients = clients.filter(c => c.created_by === user.id);
    }

    if (filteredClients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--text-muted);">Aucun client enregistré</td></tr>`;
      return;
    }

    filteredClients.forEach(c => {
      const gpsHtml = (c.latitude && c.longitude)
        ? `<a href="https://www.google.com/maps?q=${c.latitude},${c.longitude}" target="_blank" class="text-indigo" style="display:inline-flex; align-items:center; gap:4px; font-weight: 600;">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
             ${Number(c.latitude).toFixed(4)}, ${Number(c.longitude).toFixed(4)}
           </a>`
        : '-';

      const actType = c.activity_type ? c.activity_type.toLowerCase() : '';
      const actLabel = actType ? (getTranslation('activity_' + actType) || c.activity_type) : '-';

      const tr = document.createElement('tr');
      tr.setAttribute('data-vendeur-id', c.created_by || 'none');
      tr.innerHTML = `
        <td style="text-align: center; vertical-align: middle;">
          <input type="checkbox" class="client-row-checkbox" data-id="${c.id}" onchange="updateClientSelectionSummary()">
        </td>
        <td><strong>${c.full_name}</strong></td>
        <td>${c.phone_number}</td>
        <td><span class="badge badge-info">${c.dealer_number}</span></td>
        <td>${actLabel}</td>
        <td>${c.address || '-'}</td>
        <td>${gpsHtml}</td>
        <td>
          <div id="client-qr-${c.id}" onclick="viewClientQR('${c.id}')" style="cursor:pointer; width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:#fff; border-radius:4px; border:1px solid var(--border-color); overflow:hidden;" title="Voir en grand / Imprimer"></div>
        </td>
        <td><span style="font-size:0.85rem; color:var(--text-secondary);">${c.notes || '-'}</span></td>
        <td class="text-right">
          <div style="display:flex; justify-content:flex-end; gap:8px; align-items:center;">
            <button class="btn btn-outline btn-sm" onclick="editClient('${c.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="btn btn-outline btn-sm text-crimson" onclick="deleteClient('${c.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Generate QRs after embedding
    setTimeout(() => {
      filteredClients.forEach(c => {
        QR.generate(c.dealer_number, `client-qr-${c.id}`);
      });
    }, 50);
  };

  const refreshSales = async () => {
    const sales = await DB.getSales();
    const tbody = document.getElementById('sales-table-body');
    tbody.innerHTML = '';

    const role = Auth.getUserRole();
    const user = Auth.getUserProfile();
    
    let filteredSales = sales;
    if (role === 'employee' && user) {
      filteredSales = sales.filter(s => s.employee_id === user.id);
    }

    if (filteredSales.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; color:var(--text-muted);">Aucune vente enregistrée</td></tr>`;
      return;
    }

    // Group sales by client
    const groups = {};
    filteredSales.forEach(sale => {
      const clientId = sale.client_id || 'unknown';
      if (!groups[clientId]) {
        groups[clientId] = {
          clientName: sale.clients?.full_name || 'Client inconnu',
          clientPhone: sale.clients?.phone_number || '-',
          sales: [],
          totalNet: 0,
          totalQty: 0,
          paymentStatus: 'paid'
        };
      }
      groups[clientId].sales.push(sale);
      groups[clientId].totalNet += Number(sale.net_total) || 0;
      groups[clientId].totalQty += Number(sale.quantity) || 0;
      if (sale.payment_status !== 'paid') {
        groups[clientId].paymentStatus = sale.payment_status;
      }
    });

    const sortedGroups = Object.keys(groups).map(clientId => {
      const group = groups[clientId];
      const maxDate = Math.max(...group.sales.map(s => new Date(s.created_at).getTime()));
      return {
        clientId,
        ...group,
        maxDate
      };
    }).sort((a, b) => b.maxDate - a.maxDate);

    const isArabic = currentLanguage === 'ar';

    sortedGroups.forEach(group => {
      // 1. Group Header Row
      const headerTr = document.createElement('tr');
      headerTr.className = 'group-header';
      headerTr.setAttribute('data-client-id', group.clientId);
      headerTr.setAttribute('data-client-name', group.clientName);
      headerTr.setAttribute('data-client-phone', group.clientPhone);
      headerTr.setAttribute('onclick', `toggleClientGroup('${group.clientId}')`);
      
      const salesCountText = isArabic 
        ? `[${group.sales.length} مبيعات]` 
        : `[${group.sales.length} vente${group.sales.length > 1 ? 's' : ''}]`;

      const latestDateStr = new Date(group.maxDate).toLocaleDateString();

      const categories = Array.from(new Set(group.sales.map(s => s.articles?.category || 'recharge')));
      const categorySummary = categories.map(cat => getTranslation('opt_' + cat)).join(', ');

      headerTr.innerHTML = `
        <td>${latestDateStr}</td>
        <td><strong>${group.clientName}</strong> <span style="font-size:0.75rem; color:var(--text-muted); margin-left:8px;">${salesCountText}</span></td>
        <td style="color:var(--text-muted); font-size:0.8rem;">${categorySummary}</td>
        <td style="font-weight:700;">${group.totalQty} Pcs</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td class="text-success" style="font-weight:700;">${group.totalNet.toFixed(2)} DH</td>
        <td><span class="badge ${group.paymentStatus === 'paid' ? 'badge-success' : group.paymentStatus === 'unpaid' ? 'badge-crimson' : 'badge-amber'}">${getTranslation('opt_' + group.paymentStatus)}</span></td>
        <td>-</td>
        <td class="text-right">
          <button class="btn btn-outline btn-sm toggle-group-btn" style="padding:4px 8px;">
            <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px; transition: transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </td>
      `;
      tbody.appendChild(headerTr);

      // 2. Group Child Rows
      group.sales.forEach(sale => {
        const discountStr = sale.discount_type === 'percentage' 
          ? `${sale.discount_value}% (${sale.discount_amount} DH)` 
          : sale.discount_type === 'fixed' 
            ? `${sale.discount_value} DH` 
            : '-';

        const tr = document.createElement('tr');
        tr.className = 'group-child';
        tr.setAttribute('data-client-id', group.clientId);
        tr.setAttribute('data-client-name', group.clientName);
        tr.setAttribute('data-client-phone', group.clientPhone);
        tr.setAttribute('data-notes', sale.notes || '');
        tr.setAttribute('data-category', sale.articles?.category || '');
        
        tr.innerHTML = `
          <td>${new Date(sale.created_at).toLocaleString()}</td>
          <td style="color:var(--text-muted);">${group.clientName}</td>
          <td>${sale.articles?.name || 'Recharge'}</td>
          <td>${sale.quantity}</td>
          <td>${Number(sale.unit_price).toFixed(2)} DH</td>
          <td>${Number(sale.gross_total).toFixed(2)} DH</td>
          <td class="text-amber">${discountStr}</td>
          <td class="text-success" style="font-weight:700;">${Number(sale.net_total).toFixed(2)} DH</td>
          <td><span class="badge ${sale.payment_status === 'paid' ? 'badge-success' : sale.payment_status === 'unpaid' ? 'badge-crimson' : 'badge-amber'}">${getTranslation('opt_' + sale.payment_status)}</span></td>
          <td><span style="font-size:0.8rem;">${sale.team_members?.full_name || 'Vendeur'}</span></td>
          <td class="text-right">
            <div style="display:flex; justify-content:flex-end; gap:6px;">
              ${sale.payment_status !== 'paid' ? `
                <button class="btn btn-outline btn-sm text-success" onclick="event.stopPropagation(); markSaleAsPaidDirectly('${sale.id}')" title="${isArabic ? 'تأكيد السداد بالكامل' : 'Marquer comme payé directement'}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <button class="btn btn-outline btn-sm text-amber" onclick="event.stopPropagation(); openCreditPaymentModal('${sale.id}')" title="${isArabic ? 'تسجيل دفعة' : 'Enregistrer un règlement'}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                </button>
              ` : ''}
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); showReceipt('${sale.id}')" title="Ticket">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              </button>
              ${(role === 'admin' || role === 'supervisor') ? `
                <button class="btn btn-outline btn-sm text-danger" onclick="event.stopPropagation(); deleteSaleRecord('${sale.id}')" title="${isArabic ? 'حذف البيع' : 'Supprimer la vente'}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              ` : ''}
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });

    if (window.filterSalesTable) {
      filterSalesTable();
    }
  };

  const refreshStock = async () => {
    const articles = await DB.getArticles();
    const movements = await DB.getStockMovements();
    const payments = await DB.getSupplierPayments();

    const role = Auth.getUserRole();
    const user = Auth.getUserProfile();
    let filteredMovements = movements;
    let filteredPayments = payments;

    if (role === 'employee' && user) {
      filteredMovements = movements.filter(m => m.employee_id === user.id);
      filteredPayments = payments; // Do not filter supplier payments by employee so they deduct correctly for everyone
    }

    // Debug toast removed to prevent it popping up on screen

    // 1. Grid of Stock items
    const grid = document.getElementById('stock-inventory-grid');
    grid.innerHTML = '';

    articles.forEach(art => {
      const card = document.createElement('div');
      card.className = 'glass-panel stock-mini-card';
      card.style.padding = '16px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.justifyContent = 'space-between';
      card.style.borderLeft = `4px solid ${art.stock_quantity < 20 ? 'var(--crimson)' : 'var(--success)'}`;

      const isArabic = currentLanguage === 'ar';
      const priceText = (art.category === 'sim' || art.category === 'pack_sim')
        ? (isArabic ? 'سعر يدوي' : 'Prix Manuel')
        : `${art.selling_price} DH`;

      card.innerHTML = `
        <div>
          <span class="role-tag ${art.category === 'recharge' ? 'employee' : 'admin'}" style="font-size:0.65rem;">${getTranslation('opt_' + art.category)}</span>
          <h4 style="margin-top:6px; font-weight:600;">${art.name}</h4>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:16px;">
          <div>
            <div style="font-size:0.7rem; color:var(--text-muted);">Stock disponible</div>
            <div style="font-size:1.4rem; font-weight:700; color:${art.stock_quantity < 20 ? 'var(--crimson)' : 'var(--text-primary)'}">${art.stock_quantity} Pcs</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.75rem; font-weight:600; color:var(--text-secondary);">${priceText}</div>
            <div style="font-size:0.65rem; color:var(--text-muted);">Achat: ${art.buying_price} DH</div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // 2. Table of stock movements log
    const tbody = document.getElementById('stock-movements-table-body');
    tbody.innerHTML = '';

    if (filteredMovements.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Aucun mouvement de stock</td></tr>`;
    } else {
      filteredMovements.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${new Date(m.created_at).toLocaleString()}</td>
          <td><strong>${m.articles?.name || 'Article'}</strong></td>
          <td style="font-weight:700; color:${m.quantity >= 0 ? 'var(--success)' : 'var(--crimson)'}">${m.quantity >= 0 ? '+' : ''}${m.quantity}</td>
          <td><span class="badge ${(m.type === 'in' || m.type === 'supplier_invoice') ? 'badge-success' : m.type === 'sale' ? 'badge-info' : 'badge-amber'}">${getTranslation('opt_stock_' + m.type)}</span></td>
          <td>${m.team_members?.full_name || 'Opérateur'}</td>
          <td><span style="font-size:0.85rem; color:var(--text-secondary);">${m.notes || '-'}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }

    // 3. Table of supplier invoices
    const invoiceTableBody = document.getElementById('stock-invoices-table-body');
    if (invoiceTableBody) {
      invoiceTableBody.innerHTML = '';
      
      const invoiceMovements = filteredMovements.filter(m => m.type === 'supplier_invoice');
      
      const invoicesGrouped = {};
      invoiceMovements.forEach(m => {
        const invNum = m.invoice_number || 'INCONNU';
        if (!invoicesGrouped[invNum]) {
          invoicesGrouped[invNum] = {
            invoice_number: invNum,
            date: m.created_at,
            employee_name: m.team_members?.full_name || 'Inconnu',
            notes: m.notes || '-',
            discount_percentage: Number(m.discount_percentage) || 0,
            items: []
          };
        }
        invoicesGrouped[invNum].items.push({
          article_id: m.article_id,
          article_name: m.articles?.name || 'Article',
          quantity: m.quantity,
          notes: m.notes || ''
        });
      });

      const invoiceList = Object.values(invoicesGrouped).sort((a, b) => new Date(b.date) - new Date(a.date));

      if (invoiceList.length === 0) {
        invoiceTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">Aucune facture enregistrée</td></tr>`;
      } else {
        invoiceList.forEach(inv => {
          let costBrut = 0;
          inv.items.forEach(item => {
            const art = articles.find(a => a.id === item.article_id);
            if (art) {
              const match = item.notes ? item.notes.match(/\[PRICE:([\d.]+)\]/) : null;
              const basePrice = match ? (Number(match[1]) || 0) : (art.category === 'recharge' ? (Number(art.face_value) || 0) : (Number(art.buying_price) || 0));
              costBrut += item.quantity * basePrice;
            }
          });

          const discountAmount = costBrut * (inv.discount_percentage / 100);
          const costNet = Math.max(0, costBrut - discountAmount);

          const invoicePayments = filteredPayments.filter(p => p.invoice_number === inv.invoice_number);
          const totalPaid = invoicePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          const balance = Math.max(0, costNet - totalPaid);

          let paymentStatus = 'unpaid';
          if (totalPaid >= costNet && costNet > 0) {
            paymentStatus = 'paid';
          } else if (totalPaid > 0) {
            paymentStatus = 'partial';
          }

          const totalItems = inv.items.reduce((sum, item) => sum + item.quantity, 0);
          
          const payButtonHtml = `
            <button class="btn btn-outline btn-sm text-success btn-pay-invoice" onclick="openSupplierPaymentModal('${inv.invoice_number}')" title="Payer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            </button>
          `;

          const adminActionsHtml = (role === 'admin' || role === 'supervisor')
            ? `
                <button class="btn btn-outline btn-sm text-amber" onclick="openEditStockInvoiceModal('${inv.invoice_number}')" title="Modifier">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button class="btn btn-outline btn-sm text-crimson" onclick="deleteStockInvoice('${inv.invoice_number}')" title="Supprimer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              `
            : `
                <button class="btn btn-outline btn-sm text-amber" onclick="openEditStockInvoiceModal('${inv.invoice_number}')" title="Modifier">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
              `;

          const subtextHtml = inv.discount_percentage > 0
            ? `<div style="font-size:0.75rem; color:var(--text-muted); font-weight:400; margin-top:2px;">Brut: ${costBrut.toFixed(2)} DH (-${inv.discount_percentage}%)</div>`
            : '';

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${new Date(inv.date).toLocaleString()}</td>
            <td><strong>${inv.invoice_number}</strong></td>
            <td><span class="badge badge-info">${totalItems} Pcs</span></td>
            <td style="font-weight:600;">
              <span>${costNet.toFixed(2)} DH</span>
              ${subtextHtml}
            </td>
            <td class="text-success" style="font-weight:600;">${totalPaid.toFixed(2)} DH</td>
            <td class="text-crimson" style="font-weight:600;">${balance.toFixed(2)} DH</td>
            <td><span class="badge ${paymentStatus === 'paid' ? 'badge-success' : paymentStatus === 'unpaid' ? 'badge-crimson' : 'badge-amber'}">${getTranslation('opt_' + paymentStatus)}</span></td>
            <td><span style="font-size:0.85rem; color:var(--text-secondary);">${inv.notes}</span></td>
            <td class="text-right">
              <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button class="btn btn-outline btn-sm" onclick="showInvoiceDetails('${inv.invoice_number}')" title="Détails">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
                ${payButtonHtml}
                ${adminActionsHtml}
              </div>
            </td>
          `;
          invoiceTableBody.appendChild(tr);
        });
      }
    }

    // 4. Render Sellers Stock Matrix (Admin & Supervisor only)
    const matrixPanel = document.getElementById('sellers-stock-matrix-panel');
    if (matrixPanel) {
      if (role === 'admin' || role === 'supervisor') {
        matrixPanel.style.display = 'block';
        const matrixHeader = document.getElementById('sellers-stock-matrix-header');
        const matrixBody = document.getElementById('sellers-stock-matrix-body');
        
        if (matrixHeader && matrixBody) {
          matrixHeader.innerHTML = `<th style="padding: 10px 12px;">${getTranslation('th_vendeur')}</th>`;
          articles.forEach(art => {
            const th = document.createElement('th');
            th.style.padding = '10px 12px';
            th.style.fontSize = '0.75rem';
            th.textContent = art.name;
            matrixHeader.appendChild(th);
          });
          
          matrixBody.innerHTML = '';
          const team = await DB.getTeamMembers();
          const sellers = team.filter(t => t.role === 'employee' && t.is_active);
          
          if (sellers.length === 0) {
            matrixBody.innerHTML = `<tr><td colspan="${articles.length + 1}" style="text-align:center; color:var(--text-muted);">Aucun vendeur actif</td></tr>`;
          } else {
            for (const seller of sellers) {
              const tr = document.createElement('tr');
              tr.innerHTML = `<td style="padding: 10px 12px;"><strong>${seller.full_name}</strong></td>`;
              
              for (const art of articles) {
                const stock = await DB.getSellerStock(seller.id, art.id);
                const td = document.createElement('td');
                td.style.padding = '10px 12px';
                td.style.fontWeight = '600';
                td.style.color = stock < 10 ? 'var(--crimson)' : 'var(--text-primary)';
                td.textContent = `${stock} Pcs`;
                tr.appendChild(td);
              }
              matrixBody.appendChild(tr);
            }
          }
        }
      } else {
        matrixPanel.style.display = 'none';
      }
    }
  };

  const refreshTeam = async () => {
    const team = await DB.getTeamMembers();
    const tbody = document.getElementById('team-table-body');
    tbody.innerHTML = '';

    if (team.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">Aucun collaborateur trouvé</td></tr>`;
      return;
    }

    team.forEach(member => {
      const isAdmin = member.role === 'admin';
      const isSupervisor = member.role === 'supervisor';
      
      const roleClass = isAdmin ? 'badge-crimson' : isSupervisor ? 'badge-amber' : 'badge-info';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${member.full_name}</strong></td>
        <td>${member.email}</td>
        <td>${member.phone || '-'}</td>
        <td><span class="badge ${roleClass}">${getTranslation('role_' + member.role)}</span></td>
        <td>${member.assigned_sector || '-'}</td>
        <td><span class="badge badge-info">${member.dealer_code || '-'}</span></td>
        <td>
          <span class="badge ${member.is_active ? 'badge-success' : 'badge-crimson'}">${member.is_active ? 'Actif' : 'Inactif'}</span>
        </td>
        <td class="text-right">
          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="btn btn-outline btn-sm" onclick="editTeamMember('${member.id}')" title="Modifier">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="btn btn-outline btn-sm ${member.is_active ? 'text-crimson' : 'text-success'}" onclick="toggleTeamMemberStatus('${member.id}', ${member.is_active})" title="${member.is_active ? 'Désactiver' : 'Activer'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  };

  const updateReportFilters = async () => {
    const type = document.getElementById('report-type').value;
    
    // Toggle selector wrappers
    document.getElementById('report-filter-date-wrapper').style.display = type === 'daily' ? 'block' : 'none';
    document.getElementById('report-filter-month-wrapper').style.display = type === 'monthly' ? 'block' : 'none';
    document.getElementById('report-filter-agent-wrapper').style.display = type === 'daily' ? 'block' : 'none';
    document.getElementById('report-filter-sector-wrapper').style.display = type === 'sector' ? 'block' : 'none';

    // Populate agents dropdown
    const select = document.getElementById('report-filter-agent');
    select.innerHTML = `<option value="all">${getTranslation('opt_all_agents')}</option>`;
    
    const team = await DB.getTeamMembers();
    team.forEach(member => {
      const opt = document.createElement('option');
      opt.value = member.id;
      opt.textContent = member.full_name;
      select.appendChild(opt);
    });

    // Default filters date
    const today = getLocalDateStr(new Date());
    document.getElementById('report-filter-date').value = today;
    
    const month = today.substring(0, 7);
    document.getElementById('report-filter-month').value = month;

    generateReport();
  };

  const refreshCredits = async () => {
    const sales = await DB.getSales();
    const articles = await DB.getArticles();
    const tbody = document.getElementById('credits-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const role = Auth.getUserRole();
    const user = Auth.getUserProfile();
    const searchQuery = document.getElementById('credits-search')?.value.trim().toLowerCase() || '';
    const filterStatus = document.getElementById('credits-filter-status')?.value || 'all';

    // Filter sales to find credits (payment_status is unpaid or partial)
    let filteredSales = sales.filter(s => s.payment_status === 'unpaid' || s.payment_status === 'partial');

    if (role === 'employee' && user) {
      filteredSales = filteredSales.filter(s => s.employee_id === user.id);
    }

    if (searchQuery) {
      filteredSales = filteredSales.filter(s => {
        const clientName = s.clients?.full_name?.toLowerCase() || '';
        return clientName.includes(searchQuery);
      });
    }

    if (filterStatus !== 'all') {
      filteredSales = filteredSales.filter(s => s.payment_status === filterStatus);
    }

    if (filteredSales.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">${getTranslation('msg_no_report_data')}</td></tr>`;
      return;
    }

    filteredSales.forEach(sale => {
      const payments = parseClientPayments(sale.notes);
      
      let totalPaid = 0;
      if (sale.payment_status === 'paid') {
        totalPaid = Number(sale.net_total) || 0;
      } else {
        totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      }
      
      const balance = Math.max(0, (Number(sale.net_total) || 0) - totalPaid);
      const artName = sale.articles?.name || 'Recharge';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(sale.created_at).toLocaleDateString()}</td>
        <td><strong>${sale.clients?.full_name || 'Client'}</strong></td>
        <td>${artName} (x${sale.quantity})</td>
        <td style="font-weight:600;">${Number(sale.net_total).toFixed(2)} DH</td>
        <td class="text-success" style="font-weight:600;">${totalPaid.toFixed(2)} DH</td>
        <td class="text-crimson" style="font-weight:600;">${balance.toFixed(2)} DH</td>
        <td><span class="badge ${sale.payment_status === 'unpaid' ? 'badge-crimson' : 'badge-amber'}">${getTranslation('opt_' + sale.payment_status)}</span></td>
        <td><span style="font-size:0.8rem;">${sale.team_members?.full_name || 'Vendeur'}</span></td>
        <td class="text-right">
          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="btn btn-outline btn-sm text-success" onclick="openCreditPaymentModal('${sale.id}')" title="Enregistrer un règlement">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            </button>
            <button class="btn btn-outline btn-sm" onclick="showReceipt('${sale.id}')" title="Ticket">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  };

  return {
    showView,
    translatePage,
    getTranslation,
    switchLanguage,
    toggleTheme,
    showToast,
    initDashboard,
    refreshClients,
    refreshSales,
    refreshStock,
    refreshTeam,
    refreshCredits,
    updateReportFilters,
    getActiveLanguage: () => currentLanguage,
    setDateRange: (start, end) => { dashboardStartDate = start; dashboardEndDate = end; },
    getDateRange: () => ({ start: dashboardStartDate, end: dashboardEndDate })
  };
})();