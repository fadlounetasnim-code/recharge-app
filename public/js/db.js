// Database Service and Offline/Supabase Manager
const DB = (() => {
  let supabase = null;
  let useSupabase = false;

  // Initialize Supabase Client
  const init = (url, key) => {
    if (url && key && window.supabase) {
      try {
        supabase = window.supabase.createClient(url, key);
        useSupabase = true;
        localStorage.setItem('supabase_url', url);
        localStorage.setItem('supabase_key', key);
        console.log('DB: Supabase initialized successfully.');
      } catch (e) {
        console.error('DB: Failed to initialize Supabase client:', e);
        useSupabase = false;
      }
    } else {
      console.warn('DB: Supabase credentials missing. Falling back to local storage.');
      useSupabase = false;
    }
  };

  // Auto-init on load if keys exist
  const storedUrl = localStorage.getItem('supabase_url') || 'https://rzubtzpqdxanygzkquko.supabase.co';
  const storedKey = localStorage.getItem('supabase_key') || 'sb_publishable_GY2IDrcWN7G1cCaE_dThYg_RMwARiqp';
  if (storedUrl && storedKey) {
    init(storedUrl, storedKey);
  }

  // --- Local Data Helpers (Fallback) ---
  const getLocalData = (key) => JSON.parse(localStorage.getItem(key)) || [];
  const setLocalData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  // Prepopulate local storage with default articles and data for demo
  const seedLocalData = () => {
    if (getLocalData('articles').length === 0) {
      const defaultArticles = [
        { id: 'art-1', name: 'Recharge 5 DH', category: 'recharge', face_value: 5, buying_price: 4.70, selling_price: 5, stock_quantity: 0, is_active: true },
        { id: 'art-2', name: 'Recharge 10 DH', category: 'recharge', face_value: 10, buying_price: 9.40, selling_price: 10, stock_quantity: 0, is_active: true },
        { id: 'art-3', name: 'Recharge 20 DH', category: 'recharge', face_value: 20, buying_price: 18.80, selling_price: 20, stock_quantity: 0, is_active: true },
        { id: 'art-4', name: 'Recharge 50 DH', category: 'recharge', face_value: 50, buying_price: 47.00, selling_price: 50, stock_quantity: 0, is_active: true },
        { id: 'art-5', name: 'Recharge 100 DH', category: 'recharge', face_value: 100, buying_price: 94.00, selling_price: 100, stock_quantity: 0, is_active: true },
        { id: 'art-6', name: 'Recharge 500 DH', category: 'recharge', face_value: 500, buying_price: 470.00, selling_price: 500, stock_quantity: 0, is_active: true },
        { id: 'art-7', name: 'Recharge 1000 DH', category: 'recharge', face_value: 1000, buying_price: 940.00, selling_price: 1000, stock_quantity: 0, is_active: true },
        { id: 'art-8', name: 'Recharge 5000 DH', category: 'recharge', face_value: 5000, buying_price: 4700.00, selling_price: 5000, stock_quantity: 0, is_active: true },
        { id: 'art-9', name: 'Carte SIM', category: 'sim', face_value: 0, buying_price: 10.00, selling_price: 2.5, stock_quantity: 910, is_active: true },
        { id: 'art-10', name: 'Pack SIM', category: 'pack_sim', face_value: 0, buying_price: 80.00, selling_price: 2.5, stock_quantity: 0, is_active: true }
      ];
      setLocalData('articles', defaultArticles);
    }

    if (getLocalData('team_members').length === 0) {
      const defaultTeam = [
        { id: 'admin-id', full_name: 'Super Admin', email: 'admin@recharge.com', role: 'admin', is_active: true, phone: '0600000000', assigned_sector: 'National', dealer_code: 'D-ADMIN' },
        { id: 'sup-id', full_name: 'Supervisor Test', email: 'supervisor@recharge.com', role: 'supervisor', is_active: true, phone: '0611111111', assigned_sector: 'Casa-Anfa', dealer_code: 'D-SUP01' },
        { id: 'emp-id', full_name: 'Employee Test', email: 'employee@recharge.com', role: 'employee', is_active: true, phone: '0622222222', assigned_sector: 'Maarif', dealer_code: 'D-EMP01', monthly_recharges_goal: 5000.00, monthly_sims_goal: 100 }
      ];
      setLocalData('team_members', defaultTeam);
    }
  };
  seedLocalData();

  // One-time migration to set Carte SIM stock to 910
  const migrateSIMStock = async () => {
    // Local migration
    if (!localStorage.getItem('sim_stock_corrected_to_910')) {
      const articles = getLocalData('articles');
      if (articles && articles.length > 0) {
        const simArticle = articles.find(a => a.id === 'art-9');
        if (simArticle) {
          simArticle.stock_quantity = 910;
          setLocalData('articles', articles);
          localStorage.setItem('sim_stock_corrected_to_910', 'true');
          console.log('DB: Migrated local Carte SIM stock to 910 Pcs.');
        }
      }
    }

    // Supabase migration
    if (useSupabase && !localStorage.getItem('supabase_sim_stock_corrected_to_910')) {
      try {
        const { data, error } = await supabase
          .from('articles')
          .update({ stock_quantity: 910 })
          .eq('name', 'Carte SIM')
          .select();
        
        if (!error && data && data.length > 0) {
          localStorage.setItem('supabase_sim_stock_corrected_to_910', 'true');
          console.log('DB: Migrated Supabase Carte SIM stock to 910 Pcs.');
        } else if (error) {
          console.error('DB: Supabase stock migration error:', error);
        }
      } catch (err) {
        console.error('DB: Exception during Supabase stock migration:', err);
      }
    }
  };
  migrateSIMStock();

  // --- Clients CRUD ---
  const getClients = async () => {
    let clients = [];
    if (useSupabase) {
      const { data, error } = await supabase.from('clients').select('*').order('full_name', { ascending: true });
      if (!error) clients = data;
      else console.error('Supabase Clients fetch error:', error);
    } else {
      clients = getLocalData('clients');
    }

    try {
      if (window.Auth && Auth.isLoggedIn() && Auth.getUserRole() === 'employee') {
        const empId = Auth.getUserProfile().id;
        clients = clients.filter(c => c.created_by === empId);
      }
    } catch (err) {
      console.error('DB: Error filtering clients by owner:', err);
    }
    return clients;
  };

  const addClient = async (client) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('clients').insert([client]).select();
      if (!error) return data[0];
      throw error;
    }
    const clients = getLocalData('clients');
    const newClient = { ...client, id: 'client-' + Date.now(), created_at: new Date().toISOString() };
    clients.push(newClient);
    setLocalData('clients', clients);
    return newClient;
  };

  const addClients = async (clientsList) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('clients').insert(clientsList).select();
      if (!error) return data;
      throw error;
    }
    const clients = getLocalData('clients');
    const newClients = clientsList.map((c, i) => ({
      ...c,
      id: 'client-' + (Date.now() + i),
      created_at: new Date().toISOString()
    }));
    clients.push(...newClients);
    setLocalData('clients', clients);
    return newClients;
  };

  const updateClient = async (id, client) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('clients').update(client).eq('id', id).select();
      if (!error) return data[0];
      throw error;
    }
    const clients = getLocalData('clients');
    const idx = clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      clients[idx] = { ...clients[idx], ...client, updated_at: new Date().toISOString() };
      setLocalData('clients', clients);
      return clients[idx];
    }
    throw new Error('Client not found');
  };

  const deleteClient = async (id) => {
    if (useSupabase) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (!error) return true;
      throw error;
    }
    const clients = getLocalData('clients');
    const filtered = clients.filter(c => c.id !== id);
    setLocalData('clients', filtered);
    return true;
  };

  // --- Articles (Stock Catalog) CRUD ---
  const getArticles = async () => {
    let articles = [];
    if (useSupabase) {
      const { data, error } = await supabase.from('articles').select('*').order('name', { ascending: true });
      if (!error) articles = data;
      else console.error('Supabase Articles fetch error:', error);
    } else {
      articles = getLocalData('articles');
    }

    // Recalculate stock dynamically for employee role
    const sessionStr = localStorage.getItem('recharge_session') || sessionStorage.getItem('recharge_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session && session.profile && session.profile.role === 'employee') {
          const empId = session.profile.id;
          const movements = await getStockMovements();
          const employeeMovements = useSupabase ? movements : movements.filter(m => m.employee_id === empId);
          articles.forEach(art => {
            const qty = employeeMovements
              .filter(m => m.article_id === art.id)
              .reduce((sum, m) => sum + m.quantity, 0);
            art.stock_quantity = Math.max(0, qty);
          });
        }
      } catch (err) {
        console.error('DB: Error recalculating seller stock:', err);
      }
    }
    return articles;
  };

  const addArticle = async (article) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('articles').insert([article]).select();
      if (!error) return data[0];
      throw error;
    }
    const articles = getLocalData('articles');
    const newArticle = { ...article, id: 'art-' + Date.now(), created_at: new Date().toISOString() };
    articles.push(newArticle);
    setLocalData('articles', articles);
    return newArticle;
  };

  const updateArticle = async (id, article) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('articles').update(article).eq('id', id).select();
      if (!error) return data[0];
      throw error;
    }
    const articles = getLocalData('articles');
    const idx = articles.findIndex(a => a.id === id);
    if (idx !== -1) {
      articles[idx] = { ...articles[idx], ...article, updated_at: new Date().toISOString() };
      setLocalData('articles', articles);
      return articles[idx];
    }
    throw new Error('Article not found');
  };

  const deleteArticle = async (id) => {
    if (useSupabase) {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (!error) return true;
      throw error;
    }
    const articles = getLocalData('articles');
    const filtered = articles.filter(a => a.id !== id);
    setLocalData('articles', filtered);
    return true;
  };

  // --- Sales & Stock Movements Transactions ---
  const getSales = async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          clients (full_name, dealer_number, phone_number),
          team_members (full_name),
          articles (name, category)
        `)
        .order('created_at', { ascending: false });
      if (!error) return data;
      console.error('Supabase Sales fetch error:', error);
    }
    // Locally emulate joins
    const sales = getLocalData('sales');
    const clients = getLocalData('clients');
    const team = getLocalData('team_members');
    const articles = getLocalData('articles');
    return sales.map(s => ({
      ...s,
      clients: clients.find(c => c.id === s.client_id) || { full_name: s.client_name || 'Client inconnu', dealer_number: '-', phone_number: '-' },
      team_members: team.find(t => t.id === s.employee_id) || { full_name: s.employee_name || 'Employé' },
      articles: articles.find(a => a.id === s.article_id) || { name: s.article_name || 'Article' }
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const addSale = async (sale) => {
    // 0. Enforce Client Ownership check for Employee
    if (window.Auth && Auth.isLoggedIn() && Auth.getUserRole() === 'employee') {
      const empId = Auth.getUserProfile().id;
      const clients = await getClients();
      const client = clients.find(c => c.id === sale.client_id);
      if (!client || client.created_by !== empId) {
        throw new Error("Accès refusé : Ce client ne fait pas partie de votre portefeuille.");
      }
    }

    // 1. Fetch current article stock to validate
    let article = null;
    if (useSupabase) {
      const { data, error } = await supabase.from('articles').select('*').eq('id', sale.article_id).single();
      if (error || !data) throw new Error('Article not found in Supabase');
      article = data;
    } else {
      const articles = getLocalData('articles');
      article = articles.find(a => a.id === sale.article_id);
      if (!article) throw new Error('Article not found locally');
    }

    if (article.stock_quantity < sale.quantity) {
      throw new Error(`Stock insuffisant. Disponible : ${article.stock_quantity}, Demandé : ${sale.quantity}`);
    }

    // 2. Perform database insertions
    if (useSupabase) {
      // Insert Sale
      const { data: saleData, error: saleError } = await supabase.from('sales').insert([sale]).select();
      if (saleError) throw saleError;
      const insertedSale = saleData[0];

      // Log Stock Movement (negative quantity for outgoing sale)
      const movement = {
        article_id: sale.article_id,
        quantity: -sale.quantity,
        type: 'sale',
        employee_id: sale.employee_id,
        notes: `Vente de ${sale.quantity} unités`
      };
      const { error: moveError } = await supabase.from('stock_movements').insert([movement]);
      if (moveError) console.error('Failed to log stock movement in Supabase:', moveError);

      return insertedSale;
    } else {
      // Local Database Emulation
      const sales = getLocalData('sales');
      const movements = getLocalData('stock_movements');
      const articles = getLocalData('articles');

      const saleId = 'sale-' + Date.now();
      const newSale = {
        ...sale,
        id: saleId,
        created_at: new Date().toISOString()
      };
      sales.push(newSale);
      setLocalData('sales', sales);

      // Decrement stock
      const artIdx = articles.findIndex(a => a.id === sale.article_id);
      articles[artIdx].stock_quantity -= sale.quantity;
      setLocalData('articles', articles);

      // Add movement record
      const newMovement = {
        id: 'mov-' + Date.now(),
        article_id: sale.article_id,
        quantity: -sale.quantity,
        type: 'sale',
        employee_id: sale.employee_id,
        notes: `Vente de ${sale.quantity} unités`,
        created_at: new Date().toISOString()
      };
      movements.push(newMovement);
      setLocalData('stock_movements', movements);

      return newSale;
    }
  };

  const addSales = async (salesRecords) => {
    // 0. Enforce Client Ownership check for Employee
    if (window.Auth && Auth.isLoggedIn() && Auth.getUserRole() === 'employee') {
      const empId = Auth.getUserProfile().id;
      const clients = await getClients();
      for (const s of salesRecords) {
        const client = clients.find(c => c.id === s.client_id);
        if (!client || client.created_by !== empId) {
          throw new Error("Accès refusé : Un ou plusieurs clients ne font pas partie de votre portefeuille.");
        }
      }
    }

    const articles = await getArticles();
    const aggregatedQtys = {};
    salesRecords.forEach(s => {
      aggregatedQtys[s.article_id] = (aggregatedQtys[s.article_id] || 0) + s.quantity;
    });

    for (const artId in aggregatedQtys) {
      const art = articles.find(a => a.id === artId);
      if (!art) throw new Error('Article non trouvé.');
      if (art.stock_quantity < aggregatedQtys[artId]) {
        throw new Error(`Stock insuffisant pour ${art.name}. Disponible: ${art.stock_quantity}, Demandé: ${aggregatedQtys[artId]}`);
      }
    }

    if (useSupabase) {
      const { data: salesData, error: salesError } = await supabase.from('sales').insert(salesRecords).select();
      if (salesError) throw salesError;

      const movements = salesRecords.map(s => ({
        article_id: s.article_id,
        quantity: -s.quantity,
        type: 'sale',
        employee_id: s.employee_id,
        notes: s.notes || ''
      }));
      const { error: moveError } = await supabase.from('stock_movements').insert(movements);
      if (moveError) console.error('Failed to log stock movements in Supabase:', moveError);

      return salesData;
    } else {
      const localSales = getLocalData('sales');
      const localMovements = getLocalData('stock_movements');
      const localArticles = getLocalData('articles');

      const insertedSales = [];
      const now = new Date().toISOString();

      salesRecords.forEach((s, idx) => {
        const saleId = 'sale-' + Date.now() + '-' + idx + '-' + Math.floor(Math.random() * 1000);
        const newSale = {
          ...s,
          id: saleId,
          created_at: now
        };
        localSales.push(newSale);
        insertedSales.push(newSale);

        const artIdx = localArticles.findIndex(a => a.id === s.article_id);
        if (artIdx !== -1) {
          localArticles[artIdx].stock_quantity -= s.quantity;
        }

        const newMovement = {
          id: 'mov-' + Date.now() + '-' + idx + '-' + Math.floor(Math.random() * 1000),
          article_id: s.article_id,
          quantity: -s.quantity,
          type: 'sale',
          employee_id: s.employee_id,
          notes: s.notes || '',
          created_at: now
        };
        localMovements.push(newMovement);
      });

      setLocalData('sales', localSales);
      setLocalData('stock_movements', localMovements);
      setLocalData('articles', localArticles);

      const clients = getLocalData('clients');
      const team = getLocalData('team_members');
      
      return insertedSales.map(s => ({
        ...s,
        clients: clients.find(c => c.id === s.client_id) || { full_name: 'Client inconnu', dealer_number: '-' },
        team_members: team.find(t => t.id === s.employee_id) || { full_name: 'Employé' },
        articles: localArticles.find(a => a.id === s.article_id) || { name: 'Article' }
      }));
    }
  };

  const updateSale = async (id, saleData) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('sales').update(saleData).eq('id', id).select();
      if (!error) return data[0];
      throw error;
    }
    const sales = getLocalData('sales');
    const idx = sales.findIndex(s => s.id === id);
    if (idx !== -1) {
      sales[idx] = { ...sales[idx], ...saleData };
      setLocalData('sales', sales);
      return sales[idx];
    }
    throw new Error('Sale not found');
  };

  const getStockMovements = async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          articles (name),
          team_members (full_name)
        `)
        .order('created_at', { ascending: false });
      if (!error) return data;
      console.error('Supabase Stock Movements fetch error:', error);
    }
    const movements = getLocalData('stock_movements');
    const articles = getLocalData('articles');
    const team = getLocalData('team_members');
    return movements.map(m => ({
      ...m,
      articles: articles.find(a => a.id === m.article_id) || { name: 'Inconnu' },
      team_members: team.find(t => t.id === m.employee_id) || { full_name: 'Inconnu' }
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const addStockMovement = async (movement) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('stock_movements').insert([movement]).select();
      if (!error) return data[0];
      throw error;
    }
    const movements = getLocalData('stock_movements');
    const articles = getLocalData('articles');

    const newMov = { ...movement, id: 'mov-' + Date.now(), created_at: new Date().toISOString() };
    movements.push(newMov);
    setLocalData('stock_movements', movements);

    // Update article stock locally
    const idx = articles.findIndex(a => a.id === movement.article_id);
    if (idx !== -1) {
      articles[idx].stock_quantity += movement.quantity;
      if (articles[idx].stock_quantity < 0) articles[idx].stock_quantity = 0;
      setLocalData('articles', articles);
    }
    return newMov;
  };

  const addStockInvoice = async (invoiceNumber, items, employeeId, notes, discountPercentage = 0) => {
    if (useSupabase) {
      const movements = items.map(it => ({
        article_id: it.article_id,
        quantity: it.quantity,
        type: 'supplier_invoice',
        employee_id: employeeId,
        invoice_number: invoiceNumber,
        discount_percentage: discountPercentage,
        notes: it.price !== null ? `[PRICE:${it.price}] ${notes}` : notes
      }));
      const { data, error } = await supabase.from('stock_movements').insert(movements).select();
      if (!error) return data;
      throw error;
    }
    const movements = getLocalData('stock_movements');
    const articles = getLocalData('articles');
    const insertedMovements = [];

    items.forEach(it => {
      const newMov = {
        id: 'mov-' + Date.now() + Math.random(),
        article_id: it.article_id,
        quantity: it.quantity,
        type: 'supplier_invoice',
        employee_id: employeeId,
        invoice_number: invoiceNumber,
        discount_percentage: discountPercentage,
        notes: it.price !== null ? `[PRICE:${it.price}] ${notes}` : notes,
        created_at: new Date().toISOString()
      };
      movements.push(newMov);
      insertedMovements.push(newMov);

      // Update article stock locally
      const idx = articles.findIndex(a => a.id === it.article_id);
      if (idx !== -1) {
        articles[idx].stock_quantity += it.quantity;
        if (articles[idx].stock_quantity < 0) articles[idx].stock_quantity = 0;
      }
    });

    setLocalData('stock_movements', movements);
    setLocalData('articles', articles);
    return insertedMovements;
  };

  // --- Team Members CRUD ---
  const getTeamMembers = async () => {
    if (useSupabase) {
      const { data, error } = await supabase.from('team_members').select('*').order('full_name', { ascending: true });
      if (!error) return data;
      console.error('Supabase Team Members fetch error:', error);
    }
    return getLocalData('team_members');
  };

  const addTeamMember = async (member) => {
    if (useSupabase) {
      const { password, ...supabaseMember } = member;
      const { data, error } = await supabase.from('team_members').insert([supabaseMember]).select();
      if (!error) return data[0];
      throw error;
    }
    const team = getLocalData('team_members');
    const newMember = { ...member, created_at: new Date().toISOString() };
    team.push(newMember);
    setLocalData('team_members', team);
    return newMember;
  };

  const updateTeamMember = async (id, member) => {
    if (useSupabase) {
      const { password, ...supabaseMember } = member;
      const { data, error } = await supabase.from('team_members').update(supabaseMember).eq('id', id).select();
      if (!error) return data[0];
      throw error;
    }
    const team = getLocalData('team_members');
    const idx = team.findIndex(t => t.id === id);
    if (idx !== -1) {
      team[idx] = { ...team[idx], ...member, updated_at: new Date().toISOString() };
      setLocalData('team_members', team);
      return team[idx];
    }
    throw new Error('Team member not found');
  };

  const deleteTeamMember = async (id) => {
    if (useSupabase) {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (!error) return true;
      throw error;
    }
    const team = getLocalData('team_members');
    const filtered = team.filter(t => t.id !== id);
    setLocalData('team_members', filtered);
    return true;
  };

  // --- Daily Reports ---
  const getDailyReports = async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          team_members (full_name)
        `)
        .order('report_date', { ascending: false });
      if (!error) return data;
      console.error('Supabase Daily Reports fetch error:', error);
    }
    const reports = getLocalData('daily_reports');
    const team = getLocalData('team_members');
    return reports.map(r => ({
      ...r,
      team_members: team.find(t => t.id === r.employee_id) || { full_name: 'Employé' }
    })).sort((a, b) => new Date(b.report_date) - new Date(a.report_date));
  };

  const saveDailyReport = async (report) => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('daily_reports')
        .upsert([report], { onConflict: 'report_date,employee_id' })
        .select();
      if (!error) return data[0];
      throw error;
    }
    const reports = getLocalData('daily_reports');
    const idx = reports.findIndex(r => r.report_date === report.report_date && r.employee_id === report.employee_id);
    if (idx !== -1) {
      reports[idx] = { ...reports[idx], ...report, updated_at: new Date().toISOString() };
    } else {
      reports.push({ ...report, id: 'rep-' + Date.now(), created_at: new Date().toISOString() });
    }
    setLocalData('daily_reports', reports);
    return report;
  };

  // --- Supplier Payments CRUD ---
  const getSupplierPayments = async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('supplier_payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) return data;
      console.error('Supabase Supplier Payments fetch error:', error);
      if (window.UI && window.UI.showToast) {
        window.UI.showToast('Erreur Supabase: ' + (error.message || JSON.stringify(error)), 'error');
      }
    }
    const payments = getLocalData('supplier_payments');
    const team = getLocalData('team_members');
    return payments.map(p => ({
      ...p,
      team_members: team.find(t => t.id === p.employee_id) || { full_name: 'Inconnu' }
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const addSupplierPayment = async (payment) => {
    if (useSupabase) {
      const { data, error } = await supabase.from('supplier_payments').insert([payment]).select();
      if (!error) return data[0];
      throw error;
    }
    const payments = getLocalData('supplier_payments');
    const newPayment = {
      ...payment,
      id: 'pay-' + Date.now(),
      created_at: new Date().toISOString()
    };
    payments.push(newPayment);
    setLocalData('supplier_payments', payments);
    return newPayment;
  };

  const deleteStockInvoice = async (invoiceNumber) => {
    let movementsForInvoice = [];
    let articles = [];

    if (useSupabase) {
      const { data: movData, error: movErr } = await supabase.from('stock_movements').select('*').eq('invoice_number', invoiceNumber);
      if (movErr) throw movErr;
      movementsForInvoice = movData;

      const { data: artData, error: artErr } = await supabase.from('articles').select('*');
      if (artErr) throw artErr;
      articles = artData;
    } else {
      movementsForInvoice = getLocalData('stock_movements').filter(m => m.invoice_number === invoiceNumber);
      articles = getLocalData('articles');
    }

    // Check if decrements would cause negative stock
    for (const mov of movementsForInvoice) {
      const art = articles.find(a => a.id === mov.article_id);
      if (art) {
        if (art.stock_quantity < mov.quantity) {
          throw new Error(`Impossible de supprimer : le stock actuel de '${art.name}' (${art.stock_quantity}) est insuffisant pour retirer la quantité de la facture (${mov.quantity}).`);
        }
      }
    }

    if (useSupabase) {
      // In Supabase, delete trigger on movements is not set, so manually decrement article stock first
      for (const mov of movementsForInvoice) {
        const art = articles.find(a => a.id === mov.article_id);
        const { error: updateErr } = await supabase
          .from('articles')
          .update({ stock_quantity: art.stock_quantity - mov.quantity })
          .eq('id', mov.article_id);
        if (updateErr) throw updateErr;
      }

      // Delete payments
      const { error: payDelErr } = await supabase.from('supplier_payments').delete().eq('invoice_number', invoiceNumber);
      if (payDelErr) console.error(payDelErr);

      // Delete movements
      const { error: movDelErr } = await supabase.from('stock_movements').delete().eq('invoice_number', invoiceNumber);
      if (movDelErr) throw movDelErr;

    } else {
      // Local Storage Mode
      const allMovements = getLocalData('stock_movements');
      const allPayments = getLocalData('supplier_payments');
      const allArticles = getLocalData('articles');

      movementsForInvoice.forEach(mov => {
        const idx = allArticles.findIndex(a => a.id === mov.article_id);
        if (idx !== -1) {
          allArticles[idx].stock_quantity -= mov.quantity;
        }
      });

      const remainingMovements = allMovements.filter(m => m.invoice_number !== invoiceNumber);
      const remainingPayments = allPayments.filter(p => p.invoice_number !== invoiceNumber);

      setLocalData('articles', allArticles);
      setLocalData('stock_movements', remainingMovements);
      setLocalData('supplier_payments', remainingPayments);
    }

    return true;
  };

  const updateStockInvoiceMetadata = async (oldInvoiceNumber, newInvoiceNumber, discountPercentage, notes) => {
    if (useSupabase) {
      // Update movements
      const { error: movErr } = await supabase
        .from('stock_movements')
        .update({
          invoice_number: newInvoiceNumber,
          discount_percentage: discountPercentage,
          notes: notes
        })
        .eq('invoice_number', oldInvoiceNumber);
      if (movErr) throw movErr;

      // Update payments
      const { error: payErr } = await supabase
        .from('supplier_payments')
        .update({ invoice_number: newInvoiceNumber })
        .eq('invoice_number', oldInvoiceNumber);
      if (payErr) console.error(payErr);

    } else {
      // Local Storage Mode
      const movements = getLocalData('stock_movements');
      movements.forEach(m => {
        if (m.invoice_number === oldInvoiceNumber) {
          m.invoice_number = newInvoiceNumber;
          m.discount_percentage = discountPercentage;
          m.notes = notes;
        }
      });
      setLocalData('stock_movements', movements);

      const payments = getLocalData('supplier_payments');
      payments.forEach(p => {
        if (p.invoice_number === oldInvoiceNumber) {
          p.invoice_number = newInvoiceNumber;
        }
      });
      setLocalData('supplier_payments', payments);
    }
    return true;
  };

  const getSellerStock = async (employeeId, articleId) => {
    const movements = await getStockMovements();
    return movements
      .filter(m => m.article_id === articleId && m.employee_id === employeeId)
      .reduce((sum, m) => sum + m.quantity, 0);
  };

  const getCentralStock = async (articleId) => {
    const movements = await getStockMovements();
    const team = await getTeamMembers();
    const employeeIds = team.filter(t => t.role === 'employee').map(t => t.id);
    return movements
      .filter(m => m.article_id === articleId && (!m.employee_id || !employeeIds.includes(m.employee_id)))
      .reduce((sum, m) => sum + m.quantity, 0);
  };

  const addStockTransfer = async (sourceId, destId, articleId, quantity, notes) => {
    if (quantity <= 0) throw new Error("La quantité doit être supérieure à 0.");
    
    // Verify available stock
    let sourceStock = 0;
    if (sourceId === 'central') {
      sourceStock = await getCentralStock(articleId);
    } else {
      sourceStock = await getSellerStock(sourceId, articleId);
    }

    if (sourceStock < quantity) {
      throw new Error(`Stock insuffisant chez la source. Disponible : ${sourceStock}, Demandé : ${quantity}`);
    }

    const ref = 'TRF-' + Date.now();
    const sourceEmployeeId = sourceId === 'central' ? null : sourceId;
    const destEmployeeId = destId === 'central' ? null : destId;

    const sourceMovement = {
      article_id: articleId,
      quantity: -quantity,
      type: 'transfer',
      employee_id: sourceEmployeeId,
      invoice_number: ref,
      notes: `Transfert vers ${destId === 'central' ? 'Stock Central' : 'Vendeur'} | ${notes}`
    };

    const destMovement = {
      article_id: articleId,
      quantity: quantity,
      type: 'transfer',
      employee_id: destEmployeeId,
      invoice_number: ref,
      notes: `Transfert depuis ${sourceId === 'central' ? 'Stock Central' : 'Vendeur'} | ${notes}`
    };

    if (useSupabase) {
      const { data, error } = await supabase.from('stock_movements').insert([sourceMovement, destMovement]).select();
      if (error) throw error;
      return data;
    } else {
      const movements = getLocalData('stock_movements');
      const now = new Date().toISOString();

      const newMov1 = {
        ...sourceMovement,
        id: 'mov-' + Date.now() + '-1',
        created_at: now
      };

      const newMov2 = {
        ...destMovement,
        id: 'mov-' + Date.now() + '-2',
        created_at: now
      };

      movements.push(newMov1, newMov2);
      setLocalData('stock_movements', movements);

      const articles = getLocalData('articles');
      const idx = articles.findIndex(a => a.id === articleId);
      if (idx !== -1) {
        setLocalData('articles', articles);
      }
      return [newMov1, newMov2];
    }
  };

  return {
    init,
    getSupabaseClient: () => supabase,
    getUseSupabase: () => useSupabase,
    setUseSupabase: (val) => { useSupabase = val; },
    getClients,
    addClient,
    addClients,
    updateClient,
    deleteClient,
    getArticles,
    addArticle,
    updateArticle,
    deleteArticle,
    getSales,
    addSale,
    addSales,
    updateSale,
    getStockMovements,
    addStockMovement,
    addStockInvoice,
    deleteStockInvoice,
    updateStockInvoiceMetadata,
    getSupplierPayments,
    addSupplierPayment,
    getTeamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    getDailyReports,
    saveDailyReport,
    getCentralStock,
    getSellerStock,
    addStockTransfer
  };
})();