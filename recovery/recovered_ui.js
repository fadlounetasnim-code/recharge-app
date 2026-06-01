Created At: 2026-05-30T02:08:39Z
Completed At: 2026-05-30T02:08:39Z
File Path: `file:///C:/Users/ayoub/.gemini/antigravity/scratch/recharge-sim-manager/public/js/ui.js`
Total Lines: 1756
Total Bytes: 71341
Showing lines 1 to 40
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1: // UI Controller, Translation Engine and Chart Renderers (Upgraded)
2: const UI = (() => {
3:   let salesChartInstance = null;
4:   let topologyChartInstance = null;
5:   let leafletMap = null;
6:   let currentLanguage = localStorage.getItem('rs_lang') || 'fr';
7:   let currentCalendarDate = new Date();
8:   let lastDashboardSales = [];
9:   let lastDashboardReports = [];
10: 
11:   // --- Translation Dictionary (French & Arabic) ---
12:   const TRANSLATIONS = {
13:     fr: {
14:       app_title: "Recharge & SIM Manager",
15:       status_online: "En ligne",
16:       status_offline: "Hors ligne",
17:       status_syncing: "Synchronisation...",
18:       mode_demo: "Mode Démo",
19:       role_admin: "Admin",
20:       role_supervisor: "Superviseur",
21:       role_employee: "Vendeur",
22:       logout: "Se déconnecter",
23:       
24:       // Navigation
25:       nav_dashboard: "Tableau de bord",
26:       nav_dashboard_short: "Dash",
27:       nav_clients: "Clients",
28:       nav_clients_short: "Clients",
29:       nav_sales: "Ventes",
30:       nav_sales_short: "Ventes",
31:       nav_team: "Équipe",
32:       nav_team_short: "Équipe",
33:       nav_stock: "Stock",
34:       nav_reports: "Rapports",
35:       nav_settings: "Paramètres",
36:       nav_more_short: "Plus",
37:       title_more_menu: "Menu Supplémentaire",
38:       
39:       // Authentication View
40:       login_title: "Connexion",
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.