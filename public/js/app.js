// Primary Application Coordinator
let paymentPhotoBase64 = null;
let creditPaymentPhotoBase64 = null;

const getLocalDateStr = (dateInput) => {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const compressImage = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Compress to JPEG with 70% quality to drastically reduce payload size
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      callback(compressedBase64);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Database & UI
  UI.translatePage();
  checkActiveSession();

  // 2. Handle Login Submit
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const loader = document.getElementById('loading-overlay');
      
      try {
        if (loader) loader.style.display = 'flex';
        await Auth.login(email, pass);
        UI.showToast('Connexion réussie', 'success');
        setupAuthenticatedState();
      } catch (err) {
        UI.showToast(err.message || 'msg_login_failed', 'error');
      } finally {
        if (loader) loader.style.display = 'none';
      }
    });
  }

  // 3. SPA Route Navigation Binding
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = link.getAttribute('data-nav');
      navigateTo(viewId);
    });
  });

  // 4. Sales form calculation event listeners
  const salesForm = document.getElementById('sales-form');
  if (salesForm) {
    salesForm.addEventListener('submit', handleSalesSubmit);
  }

  // 5. Client form submit listener
  const clientForm = document.getElementById('client-form');
  if (clientForm) {
    clientForm.addEventListener('submit', handleClientSubmit);
  }

  // 6. Team form submit listener
  const teamForm = document.getElementById('team-form');
  if (teamForm) {
    teamForm.addEventListener('submit', handleTeamSubmit);
  }

  // 7. Stock form submit listener
  const stockForm = document.getElementById('stock-form');
  if (stockForm) {
    stockForm.addEventListener('submit', handleStockSubmit);
  }

  // 7b. Stock invoice form submit listener
  const stockInvoiceForm = document.getElementById('stock-invoice-form');
  if (stockInvoiceForm) {
    stockInvoiceForm.addEventListener('submit', handleStockInvoiceSubmit);
  }

  // 7c. Supplier Payment form submit & file upload handlers
  const supplierPaymentForm = document.getElementById('supplier-payment-form');
  if (supplierPaymentForm) {
    supplierPaymentForm.addEventListener('submit', handleSupplierPaymentSubmit);
  }

  // 7d. Edit stock invoice form submit listener
  const editStockInvoiceForm = document.getElementById('edit-stock-invoice-form');
  if (editStockInvoiceForm) {
    editStockInvoiceForm.addEventListener('submit', handleEditStockInvoiceSubmit);
  }

  // 7e. Stock transfer form submit listener
  const stockTransferForm = document.getElementById('stock-transfer-form');
  if (stockTransferForm) {
    stockTransferForm.addEventListener('submit', handleStockTransferSubmit);
  }

  // Credit Payment form submit listener
  const creditPaymentForm = document.getElementById('credit-payment-form');
  if (creditPaymentForm) {
    creditPaymentForm.addEventListener('submit', handleCreditPaymentSubmit);
  }

  const photoInput = document.getElementById('payment-photo');
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        compressImage(file, (base64) => {
          paymentPhotoBase64 = base64;
          const previewImg = document.getElementById('payment-preview-img');
          const previewDiv = document.getElementById('payment-photo-preview');
          if (previewImg && previewDiv) {
            previewImg.src = paymentPhotoBase64;
            previewDiv.style.display = 'block';
          }
        });
      }
    });
  }

  const creditPhotoInput = document.getElementById('credit-payment-photo');
  if (creditPhotoInput) {
    creditPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        compressImage(file, (base64) => {
          creditPaymentPhotoBase64 = base64;
          const previewImg = document.getElementById('credit-preview-img');
          const previewDiv = document.getElementById('credit-payment-photo-preview');
          if (previewImg && previewDiv) {
            previewImg.src = creditPaymentPhotoBase64;
            previewDiv.style.display = 'block';
          }
        });
      }
    });
  }

  // Initialize Date Range Picker default inputs and text label
  const todayStr = getLocalDateStr(new Date());
  const startDateInput = document.getElementById('dashboard-start-date');
  const endDateInput = document.getElementById('dashboard-end-date');
  const dateRangeBtn = document.getElementById('dashboard-date-range-btn');
  const dateRangeDropdown = document.getElementById('dashboard-date-range-dropdown');
  const dateRangeLabel = document.getElementById('dashboard-date-range-label');
  const btnCancelRange = document.getElementById('btn-cancel-date-range');
  const btnApplyRange = document.getElementById('btn-apply-date-range');

  const formatDateDMY = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  if (startDateInput && endDateInput && dateRangeLabel) {
    startDateInput.value = todayStr;
    endDateInput.value = todayStr;
    dateRangeLabel.textContent = `${formatDateDMY(todayStr)} ~ ${formatDateDMY(todayStr)}`;
    UI.setDateRange(todayStr, todayStr);
  }

  if (dateRangeBtn && dateRangeDropdown) {
    dateRangeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dateRangeDropdown.style.display = dateRangeDropdown.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (btnCancelRange && dateRangeDropdown) {
    btnCancelRange.addEventListener('click', () => {
      dateRangeDropdown.style.display = 'none';
    });
  }

  if (btnApplyRange && startDateInput && endDateInput && dateRangeDropdown && dateRangeLabel) {
    btnApplyRange.addEventListener('click', () => {
      const start = startDateInput.value;
      const end = endDateInput.value;
      if (!start || !end) {
        UI.showToast('Veuillez sélectionner les deux dates.', 'error');
        return;
      }
      if (start > end) {
        UI.showToast('La date de début doit être antérieure ou égale à la date de fin.', 'error');
        return;
      }
      UI.setDateRange(start, end);
      dateRangeLabel.textContent = `${formatDateDMY(start)} ~ ${formatDateDMY(end)}`;
      dateRangeDropdown.style.display = 'none';
      UI.initDashboard();
    });
  }

  document.addEventListener('click', (e) => {
    if (dateRangeDropdown && dateRangeBtn && !dateRangeBtn.contains(e.target) && !dateRangeDropdown.contains(e.target)) {
      dateRangeDropdown.style.display = 'none';
    }
  });

  const clientSelect = document.getElementById('sale-client-id');
  if (clientSelect) {
    clientSelect.addEventListener('change', updateSaleClientInfo);
  }
});

// Navigate helper
function navigateTo(viewId) {
  UI.showView(viewId);
}

// Check active session on startup
function checkActiveSession() {
  const active = Auth.checkSession();
  const loader = document.getElementById('loading-overlay');
  
  if (active) {
    setupAuthenticatedState();
  } else {
    const authView = document.getElementById('view-auth');
    if (authView) {
      authView.classList.add('active');
      authView.style.display = 'flex';
    }
    document.getElementById('app-view').style.display = 'none';
    if (loader) loader.style.display = 'none';
  }
}

// Demo Accounts Login Helper
async function quickLogin(email) {
  const loader = document.getElementById('loading-overlay');
  try {
    if (loader) loader.style.display = 'flex';
    await Auth.login(email, '123456');
    UI.showToast('Connexion réussie', 'success');
    setupAuthenticatedState();
  } catch (err) {
    UI.showToast(err.message, 'error');
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

// Setup Layout on authenticated state
function setupAuthenticatedState() {
  const profile = Auth.getUserProfile();
  const role = Auth.getUserRole();
  const loader = document.getElementById('loading-overlay');

  const authView = document.getElementById('view-auth');
  if (authView) {
    authView.classList.remove('active');
    authView.style.display = 'none';
  }
  document.getElementById('app-view').style.display = 'grid';

  // Fill user profile labels
  document.getElementById('header-username').textContent = profile.full_name;
  
  const roleTag = document.getElementById('header-user-role');
  roleTag.textContent = UI.getTranslation('role_' + role);
  roleTag.className = `role-tag ${role === 'admin' ? 'admin' : 'employee'}`;

  // Hide team links or admin settings if roles are employee
  document.querySelectorAll('[data-nav="team"]').forEach(el => {
    el.style.display = role === 'employee' ? 'none' : 'flex';
  });

  document.querySelectorAll('[data-nav="reports"]').forEach(el => {
    el.style.display = role === 'employee' ? 'none' : 'flex';
  });

  document.querySelectorAll('[data-nav="settings"]').forEach(el => {
    el.style.display = 'flex';
  });

  const btnAdjustStock = document.getElementById('btn-adjust-stock-move');
  if (btnAdjustStock) {
    btnAdjustStock.style.display = role === 'employee' ? 'none' : 'flex';
  }

  const btnTransferStock = document.getElementById('btn-transfer-stock');
  if (btnTransferStock) {
    btnTransferStock.style.display = role === 'employee' ? 'none' : 'flex';
  }

  const btnStockInvoice = document.getElementById('btn-stock-invoice');
  if (btnStockInvoice) {
    btnStockInvoice.style.display = 'flex';
  }

  const btnManageObjectives = document.getElementById('btn-manage-objectives');
  if (btnManageObjectives) {
    btnManageObjectives.style.display = role === 'employee' ? 'none' : 'flex';
  }

  // Load Settings input boxes
  const storedUrl = localStorage.getItem('supabase_url') || 'https://rzubtzpqdxanygzkquko.supabase.co';
  const storedKey = localStorage.getItem('supabase_key') || 'sb_publishable_GY2IDrcWN7G1cCaE_dThYg_RMwARiqp';
  document.getElementById('setting-supabase-url').value = storedUrl;
  document.getElementById('setting-supabase-key').value = storedKey;

  const storedRechargesGoal = localStorage.getItem('rs_monthly_recharges_goal') || '5000.00';
  const rechargesGoalInput = document.getElementById('setting-monthly-recharges-goal');
  if (rechargesGoalInput) {
    rechargesGoalInput.value = storedRechargesGoal;
  }

  const storedSimsGoal = localStorage.getItem('rs_monthly_sims_goal') || '100';
  const simsGoalInput = document.getElementById('setting-monthly-sims-goal');
  if (simsGoalInput) {
    simsGoalInput.value = storedSimsGoal;
  }

  // Show/Hide settings cards based on role (hide sensitive panels for employees/vendeurs)
  const isEmployee = role === 'employee';
  const supabaseCard = document.getElementById('settings-supabase-card');
  if (supabaseCard) {
    supabaseCard.style.display = isEmployee ? 'none' : 'block';
  }
  const offlineCard = document.getElementById('settings-offline-card');
  if (offlineCard) {
    offlineCard.style.display = isEmployee ? 'none' : 'block';
  }

  // Render dashboard elements
  navigateTo('dashboard');

  // Cleanup duplicate payments for 02/06/2026
  if (typeof DB.cleanupDuplicatePayments === 'function') {
    DB.cleanupDuplicatePayments().catch(err => console.error('Error cleaning up duplicate payments:', err));
  }
  
  if (loader) loader.style.display = 'none';

  // Refresh user profile asynchronously from Supabase to fetch any updated objectives/metadata
  refreshUserProfile();
}

async function refreshUserProfile() {
  const profile = Auth.getUserProfile();
  if (profile && DB.getUseSupabase()) {
    try {
      const client = DB.getSupabaseClient();
      const { data, error } = await client
        .from('team_members')
        .select('*')
        .eq('id', profile.id)
        .single();
      
      if (!error && data) {
        Auth.updateProfile(data);
        const headerUsername = document.getElementById('header-username');
        if (headerUsername) headerUsername.textContent = data.full_name;
        // Re-init dashboard if active to load the fresh goals
        const activeNav = document.querySelector('.sidebar .active, [data-nav="dashboard"].active');
        if (activeNav && activeNav.getAttribute('data-nav') === 'dashboard') {
          UI.initDashboard();
        }
      }
    } catch (e) {
      console.warn('Could not refresh user profile from Supabase:', e);
    }
  }
}

// Trigger Logout session
async function triggerLogout() {
  await Auth.logout();
  const authView = document.getElementById('view-auth');
  if (authView) {
    authView.classList.add('active');
    authView.style.display = 'flex';
  }
  document.getElementById('app-view').style.display = 'none';
  UI.showToast('Déconnecté', 'success');
}

async function updateSaleClientInfo() {
  const select = document.getElementById('sale-client-id');
  const infoBox = document.getElementById('sale-client-info-box');
  if (!select || !infoBox) return;

  const clientId = select.value;
  if (!clientId) {
    infoBox.style.display = 'none';
    return;
  }

  const clients = await DB.getClients();
  const client = clients.find(c => c.id === clientId);
  if (client) {
    document.getElementById('sale-client-info-name').textContent = client.full_name || 'N/A';
    document.getElementById('sale-client-info-phone').textContent = client.phone || 'N/A';
    document.getElementById('sale-client-info-dealer').textContent = client.dealer_number || 'N/A';
    infoBox.style.display = 'block';
  } else {
    infoBox.style.display = 'none';
  }
}

// --- Nouvelle Vente Modal Handling ---
// --- Multi-Item Sales Logic ---
async function openSalesModal(preselectedClientId = null) {
  const clientSelect = document.getElementById('sale-client-id');
  clientSelect.innerHTML = '<option value="">-- Sélectionner Client --</option>';

  const searchInput = document.getElementById('sale-client-search');
  if (searchInput) searchInput.value = '';

  const clients = await DB.getClients();
  window.saleFormArticles = await DB.getArticles();

  const role = Auth.getUserRole();
  const user = Auth.getUserProfile();
  let filteredClients = clients;
  if (role === 'employee' && user) {
    filteredClients = clients.filter(c => c.created_by === user.id);
  }

  window.activeSaleClients = filteredClients;

  filteredClients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.full_name} (${c.dealer_number})`;
    clientSelect.appendChild(opt);
  });

  // Reset form inputs
  document.getElementById('sales-form').reset();
  
  // Clear dynamic rows
  const container = document.getElementById('sale-items-container');
  if (container) container.innerHTML = '';

  if (preselectedClientId) {
    clientSelect.value = preselectedClientId;
  }

  // Update client info card
  await updateSaleClientInfo();

  // Add default first row
  addSaleItemRow();

  // Show Modal
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('sales-modal').style.display = 'block';
}

function filterSaleClientsDropdown() {
  const query = document.getElementById('sale-client-search').value.toLowerCase().trim();
  const select = document.getElementById('sale-client-id');
  if (!select) return;

  const currentSelection = select.value;
  select.innerHTML = '<option value="">-- Sélectionner Client --</option>';

  if (window.activeSaleClients) {
    window.activeSaleClients.forEach(c => {
      const name = c.full_name || '';
      const phone = c.phone_number || c.phone || '';
      const dealer = c.dealer_number || '';
      const matchText = `${name} ${phone} ${dealer}`.toLowerCase();
      if (matchText.includes(query)) {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${name} (${dealer})`;
        select.appendChild(opt);
      }
    });
  }

  // Restore selection if it still exists
  const optionExists = Array.from(select.options).some(opt => opt.value === currentSelection);
  if (optionExists) {
    select.value = currentSelection;
  }
}
window.filterSaleClientsDropdown = filterSaleClientsDropdown;

function addSaleItemRow() {
  const container = document.getElementById('sale-items-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'sale-item-row';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '2.2fr 1fr 1fr 1fr 40px';
  row.style.gap = '8px';
  row.style.alignItems = 'center';
  row.style.marginBottom = '8px';

  // Article select
  const articleSelect = document.createElement('select');
  articleSelect.className = 'sale-item-article-id btn-outline';
  articleSelect.style.width = '100%';
  articleSelect.style.padding = '8px';
  articleSelect.style.borderRadius = 'var(--radius-sm)';
  articleSelect.style.border = '1px solid var(--border-color)';
  articleSelect.style.background = 'var(--bg-secondary)';
  articleSelect.style.color = 'var(--text-primary)';
  articleSelect.required = true;
  articleSelect.onchange = () => onSaleItemArticleChanged(articleSelect);

  articleSelect.innerHTML = '<option value="">-- Article --</option>';
  if (window.saleFormArticles) {
    window.saleFormArticles.forEach(a => {
      if (a.is_active) {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = `${a.name} (${a.stock_quantity})`;
        articleSelect.appendChild(opt);
      }
    });
  }

  // Quantity input
  const qtyInput = document.createElement('input');
  qtyInput.type = 'number';
  qtyInput.className = 'sale-item-qty btn-outline';
  qtyInput.style.width = '100%';
  qtyInput.style.padding = '8px';
  qtyInput.style.borderRadius = 'var(--radius-sm)';
  qtyInput.style.border = '1px solid var(--border-color)';
  qtyInput.style.background = 'var(--bg-primary)';
  qtyInput.style.color = 'var(--text-primary)';
  qtyInput.min = '1';
  qtyInput.value = '1';
  qtyInput.required = true;
  qtyInput.oninput = () => calculateSaleTotals();

  // Unit Price input
  const priceInput = document.createElement('input');
  priceInput.type = 'number';
  priceInput.className = 'sale-item-unit-price btn-outline';
  priceInput.style.width = '100%';
  priceInput.style.padding = '8px';
  priceInput.style.borderRadius = 'var(--radius-sm)';
  priceInput.style.border = '1px solid var(--border-color)';
  priceInput.style.background = 'var(--bg-primary)';
  priceInput.style.color = 'var(--text-primary)';
  priceInput.step = '0.01';
  priceInput.min = '0';
  priceInput.required = true;
  priceInput.oninput = () => calculateSaleTotals();

  // Total display
  const totalDisplay = document.createElement('span');
  totalDisplay.className = 'sale-item-row-total';
  totalDisplay.style.fontWeight = '600';
  totalDisplay.style.textAlign = 'right';
  totalDisplay.style.fontSize = '0.85rem';
  totalDisplay.style.color = 'var(--text-primary)';
  totalDisplay.textContent = '0.00 DH';

  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-outline btn-sm text-crimson';
  removeBtn.style.padding = '4px 8px';
  removeBtn.style.border = 'none';
  removeBtn.style.display = 'flex';
  removeBtn.style.alignItems = 'center';
  removeBtn.style.justifyContent = 'center';
  removeBtn.onclick = () => removeSaleItemRow(row);
  removeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

  row.appendChild(articleSelect);
  row.appendChild(qtyInput);
  row.appendChild(priceInput);
  row.appendChild(totalDisplay);
  row.appendChild(removeBtn);

  container.appendChild(row);
  calculateSaleTotals();
}

function removeSaleItemRow(rowEl) {
  const container = document.getElementById('sale-items-container');
  if (!container) return;

  if (container.children.length <= 1) {
    UI.showToast("Il faut avoir au moins un article dans la vente.", "error");
    return;
  }

  rowEl.remove();
  calculateSaleTotals();
}

function onSaleItemArticleChanged(selectEl) {
  const row = selectEl.parentElement;
  if (!row) return;

  const articleId = selectEl.value;
  const priceInput = row.querySelector('.sale-item-unit-price');

  if (!articleId) {
    if (priceInput) {
      priceInput.value = '';
      priceInput.readOnly = false;
      priceInput.style.opacity = '1';
      priceInput.style.pointerEvents = 'auto';
    }
    calculateSaleTotals();
    return;
  }

  if (window.saleFormArticles) {
    const art = window.saleFormArticles.find(a => a.id === articleId);
    if (art && priceInput) {
      if (art.category === 'sim' || art.category === 'pack_sim') {
        priceInput.value = 2.5; // default to 2.5 DH for SIMs
        priceInput.readOnly = false;
        priceInput.style.opacity = '1';
        priceInput.style.pointerEvents = 'auto';
      } else {
        priceInput.value = art.selling_price;
        // Make recharge prices fixed
        priceInput.readOnly = true;
        priceInput.style.opacity = '0.7';
        priceInput.style.pointerEvents = 'none';
      }
      calculateSaleTotals();
    }
  }
}

function calculateSaleTotals() {
  const container = document.getElementById('sale-items-container');
  if (!container) return;

  let grossSum = 0;

  Array.from(container.children).forEach(row => {
    const qty = Number(row.querySelector('.sale-item-qty').value) || 0;
    const price = Number(row.querySelector('.sale-item-unit-price').value) || 0;
    const lineGross = qty * price;
    grossSum += lineGross;

    const rowTotalSpan = row.querySelector('.sale-item-row-total');
    if (rowTotalSpan) {
      rowTotalSpan.textContent = `${lineGross.toFixed(2)} DH`;
    }
  });

  const discountType = document.getElementById('sale-discount-type').value;
  const discountVal = Number(document.getElementById('sale-discount-value').value) || 0;

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = grossSum * (discountVal / 100);
  } else if (discountType === 'fixed') {
    discountAmount = discountVal;
  }

  const net = Math.max(0, grossSum - discountAmount);

  document.getElementById('sale-calc-gross').textContent = `${grossSum.toFixed(2)} DH`;
  document.getElementById('sale-calc-discount').textContent = `${discountAmount.toFixed(2)} DH`;
  document.getElementById('sale-calc-net').textContent = `${net.toFixed(2)} DH`;
}

async function handleSalesSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
  }

  const clientId = document.getElementById('sale-client-id').value;
  const paymentStatus = document.getElementById('sale-payment-status').value;
  const notes = document.getElementById('sale-notes').value.trim();
  const discountType = document.getElementById('sale-discount-type').value;
  const discountValue = Number(document.getElementById('sale-discount-value').value) || 0;

  if (!clientId) {
    UI.showToast('Veuillez sélectionner un client.', 'error');
    return;
  }

  const container = document.getElementById('sale-items-container');
  if (!container || container.children.length === 0) {
    UI.showToast('Veuillez ajouter au moins un article.', 'error');
    return;
  }

  const rows = [];
  let hasEmpty = false;

  Array.from(container.children).forEach(row => {
    const articleId = row.querySelector('.sale-item-article-id').value;
    const quantity = Number(row.querySelector('.sale-item-qty').value) || 0;
    const unitPrice = Number(row.querySelector('.sale-item-unit-price').value) || 0;

    if (!articleId || quantity <= 0) {
      hasEmpty = true;
    }

    rows.push({
      articleId,
      quantity,
      unitPrice,
      gross: quantity * unitPrice
    });
  });

  if (hasEmpty) {
    UI.showToast('Veuillez configurer correctement tous les articles et quantités.', 'error');
    return;
  }

  const loader = document.getElementById('loading-overlay');
  try {
    if (loader) loader.style.display = 'flex';

    // Verify aggregated stock
    const aggregatedQtys = {};
    rows.forEach(r => {
      aggregatedQtys[r.articleId] = (aggregatedQtys[r.articleId] || 0) + r.quantity;
    });

    const articles = await DB.getArticles();
    for (const artId in aggregatedQtys) {
      const art = articles.find(a => a.id === artId);
      if (!art) throw new Error('Article non trouvé.');
      if (art.stock_quantity < aggregatedQtys[artId]) {
        throw new Error(`Stock insuffisant pour ${art.name}. Disponible: ${art.stock_quantity}, Demandé: ${aggregatedQtys[artId]}`);
      }
    }

    const grossTotalSum = rows.reduce((sum, r) => sum + r.gross, 0);
    let globalDiscountAmount = 0;
    if (discountType === 'percentage') {
      globalDiscountAmount = grossTotalSum * (discountValue / 100);
    } else if (discountType === 'fixed') {
      globalDiscountAmount = discountValue;
    }

    const grpId = 'grp-' + Date.now() + Math.floor(Math.random() * 1000);
    const user = Auth.getUserProfile();

    const initialPaid = Number(document.getElementById('sale-initial-paid')?.value) || 0;

    const salesRecords = rows.map(row => {
      const ratio = grossTotalSum > 0 ? (row.gross / grossTotalSum) : 0;
      const lineDiscountAmount = globalDiscountAmount * ratio;
      const lineNet = Math.max(0, row.gross - lineDiscountAmount);

      const lineInitialPaid = initialPaid * ratio;
      const paymentTag = paymentStatus === 'partial' 
        ? `[PMTS:[{"amount":${lineInitialPaid},"method":"cash","created_at":"${new Date().toISOString()}"}]]` 
        : '';
      const finalNotes = notes 
        ? `[GRP-${grpId}] ${paymentTag} ${notes}` 
        : `[GRP-${grpId}] ${paymentTag}`;

      return {
        client_id: clientId,
        employee_id: user.id,
        article_id: row.articleId,
        quantity: row.quantity,
        unit_price: row.unitPrice,
        discount_type: discountType === 'percentage' ? 'percentage' : 'fixed',
        discount_value: discountType === 'percentage' ? discountValue : lineDiscountAmount,
        discount_amount: lineDiscountAmount,
        gross_total: row.gross,
        net_total: lineNet,
        payment_status: paymentStatus,
        notes: finalNotes.trim()
      };
    });

    const insertedSales = await DB.addSales(salesRecords);
    UI.showToast('msg_save_success', 'success');
    closeActiveModal();

    // Refresh view
    await UI.initDashboard();

    // Show receipt ticket automatically
    showReceipt(insertedSales[0].id);

  } catch (err) {
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

// --- Client Form CRUD Handlers ---
async function openClientModal(client = null) {
  document.getElementById('client-form').reset();
  
  const title = document.getElementById('client-modal-title');
  const idInput = document.getElementById('client-form-id');

  if (client) {
    title.textContent = UI.getTranslation('modal_edit_client_title') || 'Modifier Client';
    idInput.value = client.id;
    document.getElementById('client-name').value = client.full_name;
    document.getElementById('client-phone').value = client.phone_number;
    document.getElementById('client-dealer').value = client.dealer_number;
    document.getElementById('client-activity').value = client.activity_type;
    document.getElementById('client-address').value = client.address || '';
    document.getElementById('client-latitude').value = client.latitude || '';
    document.getElementById('client-longitude').value = client.longitude || '';
    document.getElementById('client-notes').value = client.notes || '';
  } else {
    title.textContent = UI.getTranslation('modal_new_client_title') || 'Nouveau Client';
    idInput.value = '';
    document.getElementById('client-latitude').value = '';
    document.getElementById('client-longitude').value = '';
  }

  // Populate vendor dropdown
  const sellerSelect = document.getElementById('client-vendeur-id');
  if (sellerSelect) {
    sellerSelect.innerHTML = '<option value="">-- Aucun Vendeur --</option>';
    const team = await DB.getTeamMembers();
    const activeEmployees = team.filter(t => t.role === 'employee' && t.is_active);
    activeEmployees.forEach(emp => {
      const opt = document.createElement('option');
      opt.value = emp.id;
      opt.textContent = emp.full_name;
      sellerSelect.appendChild(opt);
    });

    const role = Auth.getUserRole();
    const user = Auth.getUserProfile();
    const group = document.getElementById('client-vendeur-group');
    if (role === 'employee' && user) {
      if (group) group.style.display = 'none';
      sellerSelect.value = user.id;
    } else {
      if (group) group.style.display = 'block';
      sellerSelect.value = client ? (client.created_by || '') : '';
    }
  }

  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('client-modal').style.display = 'block';
}

async function handleClientSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
  }
  const loader = document.getElementById('loading-overlay');
  if (loader) loader.style.display = 'flex';
  const id = document.getElementById('client-form-id').value;
  const full_name = document.getElementById('client-name').value;
  const phone_number = document.getElementById('client-phone').value;
  const dealer_number = document.getElementById('client-dealer').value;
  const activity_type = document.getElementById('client-activity').value;
  const address = document.getElementById('client-address').value;
  const latitude = document.getElementById('client-latitude').value ? Number(document.getElementById('client-latitude').value) : null;
  const longitude = document.getElementById('client-longitude').value ? Number(document.getElementById('client-longitude').value) : null;
  const notes = document.getElementById('client-notes').value;

  const clientData = { full_name, phone_number, dealer_number, activity_type, address, latitude, longitude, notes };
  const user = Auth.getUserProfile();
  
  const selectedSellerId = document.getElementById('client-vendeur-id')?.value;
  clientData.created_by = selectedSellerId ? selectedSellerId : user.id;

  try {
    if (id) {
      await DB.updateClient(id, clientData);
    } else {
      await DB.addClient(clientData);
    }
    UI.showToast('msg_save_success', 'success');
    closeActiveModal();
    UI.refreshClients();
  } catch (err) {
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

function detectGPS() {
  if (navigator.geolocation) {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.style.display = 'flex';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        document.getElementById('client-latitude').value = position.coords.latitude.toFixed(6);
        document.getElementById('client-longitude').value = position.coords.longitude.toFixed(6);
        if (loader) loader.style.display = 'none';
        UI.showToast("Localisation GPS détectée !", "success");
      },
      (error) => {
        if (loader) loader.style.display = 'none';
        console.error(error);
        UI.showToast("Erreur GPS: " + error.message, "error");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  } else {
    UI.showToast("Géolocalisation non supportée", "error");
  }
}

let html5QrcodeScanner = null;

function openQRScanner() {
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('qr-scanner-modal').style.display = 'block';
  
  try {
    if (typeof Html5Qrcode === 'undefined') {
      throw new Error("La bibliothèque de scan QR n'est pas disponible.");
    }
    
    html5QrcodeScanner = new Html5Qrcode("qr-reader");
    
    const onScanSuccess = async (decodedText) => {
      closeQRScanner();
      
      const cleanText = decodedText.trim().toLowerCase();
      const clients = await DB.getClients();
      
      if (clients.length === 0) {
        UI.showToast("Aucun client dans la base. Créez d'abord un client.", "error");
        return;
      }

      const client = clients.find(c => 
        (c.dealer_number && c.dealer_number.trim().toLowerCase() === cleanText) || 
        (c.id && c.id.trim().toLowerCase() === cleanText)
      );

      if (client) {
        navigateTo('sales');
        openSalesModal(client.id);
        UI.showToast(`Client ${client.full_name} sélectionné`, "success");
      } else {
        UI.showToast("Client non trouvé", "error");
      }
    };
    
    const onScanFailure = (errorMessage) => {
      // Ignored to avoid spamming console
    };

    html5QrcodeScanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      onScanSuccess,
      onScanFailure
    ).catch(err => {
      console.warn("Camera facingMode environment failed, trying fallback constraints:", err);
      // Fallback: try starting with empty constraints (defaults to default system camera)
      html5QrcodeScanner.start(
        {},
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanFailure
      ).catch(err2 => {
        console.error("Camera fallback failed:", err2);
        UI.showToast("Erreur camera: " + err2.message, "error");
      });
    });
  } catch (err) {
    console.error("QR Scanner Init Error:", err);
    UI.showToast("Erreur scanner: " + err.message, "error");
  }
}

function closeQRScanner() {
  document.getElementById('qr-scanner-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
  if (html5QrcodeScanner) {
    try {
      html5QrcodeScanner.stop().then(() => {
        html5QrcodeScanner = null;
      }).catch(err => {
        console.error("Error stopping scanner:", err);
        html5QrcodeScanner = null;
      });
    } catch (err) {
      console.error("Error calling stop on scanner:", err);
      html5QrcodeScanner = null;
    }
  }
}

async function viewClientQR(clientId) {
  const clients = await DB.getClients();
  const client = clients.find(c => c.id === clientId);
  if (client) {
    document.getElementById('client-qr-modal-name').textContent = client.full_name;
    document.getElementById('client-qr-modal-dealer').textContent = client.dealer_number;
    
    const container = document.getElementById('large-client-qr');
    if (container) {
      try {
        container.innerHTML = '';
        const qr = qrcode(4, 'L');
        qr.addData(client.dealer_number);
        qr.make();
        container.innerHTML = qr.createImgTag(8, 16);
      } catch (err) {
        console.error(err);
      }
    }
    
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('client-qr-modal').style.display = 'block';
  }
}

function closeClientQRModal() {
  document.getElementById('client-qr-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
}

function printClientQR() {
  const name = document.getElementById('client-qr-modal-name').textContent;
  PDF.exportToPDF('large-client-qr', `QR_Code_${name.replace(/\s+/g, '_')}.pdf`);
}

window.editClient = async (id) => {
  const clients = await DB.getClients();
  const client = clients.find(c => c.id === id);
  if (client) openClientModal(client);
};

window.deleteClient = async (id) => {
  if (confirm(UI.getTranslation('msg_confirm_delete'))) {
    try {
      await DB.deleteClient(id);
      UI.showToast('msg_delete_success', 'success');
      UI.refreshClients();
    } catch (err) {
      UI.showToast(err.message, 'error');
    }
  }
};

// --- Team Form CRUD Handlers ---
async function openTeamModal(member = null) {
  document.getElementById('team-form').reset();
  const title = document.getElementById('team-modal-title');
  const idInput = document.getElementById('team-form-id');

  if (member) {
    title.textContent = 'Modifier Collaborateur';
    idInput.value = member.id;
    document.getElementById('team-name').value = member.full_name;
    document.getElementById('team-email').value = member.email;
    document.getElementById('team-email').readOnly = true; // Email unique / user auth
    document.getElementById('team-phone').value = member.phone || '';
    document.getElementById('team-role').value = member.role;
    document.getElementById('team-sector').value = member.assigned_sector || '';
    document.getElementById('team-dealer-code').value = member.dealer_code || '';
    
    // Non-admin supervisor check
    const currentRole = Auth.getUserRole();
    document.getElementById('team-role').disabled = currentRole !== 'admin';
  } else {
    title.textContent = 'Ajouter Collaborateur';
    idInput.value = '';
    document.getElementById('team-email').readOnly = false;
    document.getElementById('team-role').disabled = false;
  }

  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('team-modal').style.display = 'block';
}

async function handleTeamSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
  }
  const loader = document.getElementById('loading-overlay');
  if (loader) loader.style.display = 'flex';
  const id = document.getElementById('team-form-id').value;
  const full_name = document.getElementById('team-name').value;
  const email = document.getElementById('team-email').value;
  const phone = document.getElementById('team-phone').value;
  const role = document.getElementById('team-role').value;
  const assigned_sector = document.getElementById('team-sector').value;
  const dealer_code = document.getElementById('team-dealer-code').value;
  const password = document.getElementById('team-password').value;

  const memberData = { full_name, email, phone, role, assigned_sector, dealer_code };

  // Handle password saving
  if (password) {
    memberData.password = password;
  } else if (!id) {
    memberData.password = '123456'; // Default for new members
  }

  try {
    if (id) {
      await DB.updateTeamMember(id, memberData);
    } else {
      // In local mode, create random uuid.
      memberData.id = 'member-' + Date.now();
      memberData.is_active = true;
      await DB.addTeamMember(memberData);
    }
    UI.showToast('msg_save_success', 'success');
    closeActiveModal();
    UI.refreshTeam();
  } catch (err) {
    UI.showToast(err.message, 'error');
  } finally {
    if (loader) loader.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

window.editTeamMember = async (id) => {
  const team = await DB.getTeamMembers();
  const member = team.find(t => t.id === id);
  if (member) openTeamModal(member);
};

window.toggleTeamMemberStatus = async (id, currentStatus) => {
  try {
    await DB.updateTeamMember(id, { is_active: !currentStatus });
    UI.showToast('msg_save_success', 'success');
    UI.refreshTeam();
  } catch (err) {
    UI.showToast(err.message, 'error');
  }
};

// --- Stock Movements Handling ---
async function openStockMovementModal() {
  const select = document.getElementById('stock-article-id');
  select.innerHTML = '<option value="">-- Sélectionner Article --</option>';
  
  const articles = await DB.getArticles();
  articles.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.name;
    select.appendChild(opt);
  });

  document.getElementById('stock-form').reset();
  
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('stock-modal').style.display = 'block';
}

async function handleStockSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
  }
  const loader = document.getElementById('loading-overlay');
  if (loader) loader.style.display = 'flex';
  const articleId = document.getElementById('stock-article-id').value;
  const type = document.getElementById('stock-movement-type').value;
  const qty = Number(document.getElementById('stock-quantity-input').value);
  const notes = document.getElementById('stock-notes').value;

  if (!articleId || qty <= 0) return;

  // If outgoing, convert qty to negative
  const quantity = type === 'out' ? -qty : qty;
  const user = Auth.getUserProfile();

  const movement = {
    article_id: articleId,
    quantity,
    type,
    notes,
    employee_id: user.id
  };

  try {
    await DB.addStockMovement(movement);
    UI.showToast('msg_save_success', 'success');
    closeActiveModal();
    UI.refreshStock();
  } catch (err) {
    UI.showToast(err.message, 'error');
  } finally {
    if (loader) loader.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

async function openStockInvoiceModal() {
  const grid = document.getElementById('stock-invoice-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const articles = await DB.getArticles();
  articles.forEach(a => {
    const container = document.createElement('div');
    container.className = 'form-group';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '4px';

    if (a.category === 'sim') {
      container.innerHTML = `
        <label class="label" style="font-size:0.8rem;">${a.name} (Stock: ${a.stock_quantity})</label>
        <div style="display: flex; gap: 8px; flex-direction: column;">
          <select class="sim-mode-select btn-outline" data-article-id="${a.id}" style="padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary);">
            <option value="simple" data-i18n="opt_sim_mode_simple">Saisie Simple</option>
            <option value="serial" data-i18n="opt_sim_mode_serial">Numéros de Série</option>
            <option value="colisage" data-i18n="opt_sim_mode_colisage">Colisage</option>
          </select>

          <div class="sim-input-serial-container" style="display:none; gap:8px;">
            <input type="number" class="sim-serial-start btn-outline" placeholder="N° Début (ex: 89212001)" style="flex:1; padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary);">
            <input type="number" class="sim-serial-end btn-outline" placeholder="N° Fin (ex: 89212050)" style="flex:1; padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary);">
          </div>

          <div class="sim-input-colisage-container" style="display:none; gap:8px;">
            <input type="number" class="sim-colis-count btn-outline" placeholder="Nbre de colis" style="flex:1; padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary);">
            <input type="number" class="sim-colis-size btn-outline" placeholder="Taille (ex: 50)" style="flex:1; padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary);">
          </div>

          <div>
            <span style="font-size: 0.75rem; color: var(--text-secondary);" data-i18n="label_sim_qty_calculated">Quantité :</span>
            <input type="number" name="article-qty" data-article-id="${a.id}" class="btn-outline article-qty-input" style="width:100%; padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary);" min="0" value="0">
          </div>

          <input type="number" name="article-price" data-article-id="${a.id}" class="btn-outline article-price-input" style="width:100%; padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary);" min="0" step="0.01" value="2.5" placeholder="Prix d'achat (Défaut: 2.5)">
        </div>
      `;
    } else {
      container.innerHTML = `
        <label class="label" style="font-size:0.8rem;">${a.name} (Stock: ${a.stock_quantity})</label>
        <input type="number" name="article-qty" data-article-id="${a.id}" class="btn-outline article-qty-input" style="width:100%; padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary);" min="0" value="0">
      `;
    }
    grid.appendChild(container);

    if (a.category === 'sim') {
      const modeSelect = container.querySelector('.sim-mode-select');
      const serialContainer = container.querySelector('.sim-input-serial-container');
      const colisageContainer = container.querySelector('.sim-input-colisage-container');
      const qtyInput = container.querySelector('.article-qty-input');
      const serialStart = container.querySelector('.sim-serial-start');
      const serialEnd = container.querySelector('.sim-serial-end');
      const colisCount = container.querySelector('.sim-colis-count');
      const colisSize = container.querySelector('.sim-colis-size');

      const updateCalculatedQty = () => {
        const mode = modeSelect.value;
        if (mode === 'simple') {
          // No auto-calculation
        } else if (mode === 'serial') {
          const start = Number(serialStart.value) || 0;
          const end = Number(serialEnd.value) || 0;
          if (start > 0 && end >= start) {
            qtyInput.value = end - start + 1;
          } else {
            qtyInput.value = 0;
          }
        } else if (mode === 'colisage') {
          const count = Number(colisCount.value) || 0;
          const size = Number(colisSize.value) || 0;
          if (count > 0 && size > 0) {
            qtyInput.value = count * size;
          } else {
            qtyInput.value = 0;
          }
        }
      };

      modeSelect.addEventListener('change', () => {
        const mode = modeSelect.value;
        if (mode === 'simple') {
          serialContainer.style.display = 'none';
          colisageContainer.style.display = 'none';
          qtyInput.readOnly = false;
          qtyInput.style.opacity = '1';
        } else if (mode === 'serial') {
          serialContainer.style.display = 'flex';
          colisageContainer.style.display = 'none';
          qtyInput.readOnly = true;
          qtyInput.style.opacity = '0.7';
          updateCalculatedQty();
        } else if (mode === 'colisage') {
          serialContainer.style.display = 'none';
          colisageContainer.style.display = 'flex';
          qtyInput.readOnly = true;
          qtyInput.style.opacity = '0.7';
          updateCalculatedQty();
        }
      });

      serialStart.addEventListener('input', updateCalculatedQty);
      serialEnd.addEventListener('input', updateCalculatedQty);
      colisCount.addEventListener('input', updateCalculatedQty);
      colisSize.addEventListener('input', updateCalculatedQty);
    }
  });

  if (window.UI && typeof UI.translatePage === 'function') {
    UI.translatePage();
  }

  // Populate vendor dropdown
  const sellerSelect = document.getElementById('stock-invoice-vendeur-id');
  if (sellerSelect) {
    sellerSelect.innerHTML = '<option value="">-- Central Admin Stock --</option>';
    const team = await DB.getTeamMembers();
    const activeEmployees = team.filter(t => t.role === 'employee' && t.is_active);
    activeEmployees.forEach(emp => {
      const opt = document.createElement('option');
      opt.value = emp.id;
      opt.textContent = emp.full_name;
      sellerSelect.appendChild(opt);
    });

    const role = Auth.getUserRole();
    const user = Auth.getUserProfile();
    const group = document.getElementById('stock-invoice-vendeur-group');
    if (role === 'employee' && user) {
      if (group) group.style.display = 'none';
      sellerSelect.value = user.id;
    } else {
      if (group) group.style.display = 'block';
      sellerSelect.value = '';
    }
  }

  document.getElementById('stock-invoice-form').reset();
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('stock-invoice-modal').style.display = 'block';
}

async function handleStockInvoiceSubmit(e) {
  e.preventDefault();
  const invoiceNumber = document.getElementById('stock-invoice-number').value.trim();
  const discountPercentage = Number(document.getElementById('stock-invoice-discount').value) || 0;
  let notes = document.getElementById('stock-invoice-notes').value.trim();

  // Look for Carte SIM inputs and append metadata to notes
  const simContainer = document.querySelector('#stock-invoice-grid .sim-mode-select');
  if (simContainer) {
    const mode = simContainer.value;
    const qty = Number(document.querySelector('#stock-invoice-grid .article-qty-input[data-article-id="' + simContainer.getAttribute('data-article-id') + '"]').value) || 0;
    
    if (qty > 0) {
      if (mode === 'serial') {
        const start = document.querySelector('#stock-invoice-grid .sim-serial-start').value.trim();
        const end = document.querySelector('#stock-invoice-grid .sim-serial-end').value.trim();
        if (start && end) {
          const serialNotes = `[Séries: ${start} - ${end}]`;
          notes = notes ? `${notes} | ${serialNotes}` : serialNotes;
        }
      } else if (mode === 'colisage') {
        const count = document.querySelector('#stock-invoice-grid .sim-colis-count').value.trim();
        const size = document.querySelector('#stock-invoice-grid .sim-colis-size').value.trim();
        if (count && size) {
          const colisNotes = `[Colisage: ${count} x ${size}]`;
          notes = notes ? `${notes} | ${colisNotes}` : colisNotes;
        }
      }
    }
  }

  if (!invoiceNumber) {
    UI.showToast('Veuillez entrer un numéro de facture.', 'error');
    return;
  }

  const items = [];
  const inputs = document.querySelectorAll('#stock-invoice-grid .article-qty-input');
  inputs.forEach(input => {
    const articleId = input.getAttribute('data-article-id');
    const quantity = Number(input.value) || 0;
    if (quantity > 0) {
      const priceInput = document.querySelector(`#stock-invoice-grid .article-price-input[data-article-id="${articleId}"]`);
      const customPrice = priceInput ? (Number(priceInput.value) || 0) : null;
      items.push({
        article_id: articleId,
        quantity: quantity,
        price: customPrice
      });
    }
  });

  if (items.length === 0) {
    UI.showToast('Veuillez entrer une quantité pour au moins un article.', 'error');
    return;
  }

  const user = Auth.getUserProfile();
  const selectedSellerId = document.getElementById('stock-invoice-vendeur-id')?.value;
  const targetEmployeeId = selectedSellerId ? selectedSellerId : (user ? user.id : null);
  const loader = document.getElementById('loading-overlay');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  try {
    if (loader) loader.style.display = 'flex';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    }
    await DB.addStockInvoice(invoiceNumber, items, targetEmployeeId, notes, discountPercentage);
    UI.showToast('msg_save_success', 'success');
    closeActiveModal();
    UI.refreshStock();
  } catch (err) {
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

async function openStockTransferModal() {
  const sourceSelect = document.getElementById('transfer-source-id');
  const destSelect = document.getElementById('transfer-dest-id');
  const articleSelect = document.getElementById('transfer-article-id');
  
  if (!sourceSelect || !destSelect || !articleSelect) return;
  
  document.getElementById('stock-transfer-form').reset();
  document.getElementById('transfer-max-stock-helper').textContent = "Max disponible : 0";
  
  const articles = await DB.getArticles();
  const team = await DB.getTeamMembers();
  const sellers = team.filter(t => t.role === 'employee' && t.is_active);
  
  // Populate articles
  articleSelect.innerHTML = '<option value="">-- Sélectionner Article --</option>';
  articles.forEach(a => {
    if (a.is_active) {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.name;
      articleSelect.appendChild(opt);
    }
  });
  
  // Populate source
  sourceSelect.innerHTML = '<option value="central">Stock Central</option>';
  sellers.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.full_name;
    sourceSelect.appendChild(opt);
  });
  
  // Populate destination
  destSelect.innerHTML = '<option value="">-- Sélectionner Destination --</option>';
  destSelect.innerHTML += '<option value="central">Stock Central</option>';
  sellers.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.full_name;
    destSelect.appendChild(opt);
  });
  
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('stock-transfer-modal').style.display = 'block';
}

async function onTransferSourceOrArticleChanged() {
  const sourceId = document.getElementById('transfer-source-id').value;
  const articleId = document.getElementById('transfer-article-id').value;
  const helper = document.getElementById('transfer-max-stock-helper');
  const qtyInput = document.getElementById('transfer-qty-input');
  
  if (!sourceId || !articleId || !helper || !qtyInput) return;
  
  let available = 0;
  try {
    if (sourceId === 'central') {
      available = await DB.getCentralStock(articleId);
    } else {
      available = await DB.getSellerStock(sourceId, articleId);
    }
  } catch (err) {
    console.error('Error fetching stock for transfer:', err);
  }
  
  helper.textContent = `Max disponible : ${available}`;
  qtyInput.max = available;
}

async function handleStockTransferSubmit(e) {
  e.preventDefault();
  
  const sourceId = document.getElementById('transfer-source-id').value;
  const destId = document.getElementById('transfer-dest-id').value;
  const articleId = document.getElementById('transfer-article-id').value;
  const qty = Number(document.getElementById('transfer-qty-input').value) || 0;
  const notes = document.getElementById('transfer-notes').value.trim();
  
  if (!sourceId || !destId || !articleId || qty <= 0) {
    UI.showToast("Veuillez remplir tous les champs obligatoires.", "error");
    return;
  }
  
  if (sourceId === destId) {
    UI.showToast("La source et la destination doivent être différentes.", "error");
    return;
  }
  
  const loader = document.getElementById('loading-overlay');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  try {
    if (loader) loader.style.display = 'flex';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    }
    await DB.addStockTransfer(sourceId, destId, articleId, qty, notes);
    UI.showToast("Transfert effectué avec succès !", "success");
    closeActiveModal();
    UI.refreshStock();
  } catch (err) {
    UI.showToast(err.message || "Erreur de transfert", "error");
  } finally {
    if (loader) loader.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

async function viewCreditPaymentPhoto(saleId, paymentIndex) {
  const sales = await DB.getSales();
  const sale = sales.find(s => s.id === saleId);
  if (sale) {
    const match = sale.notes ? sale.notes.match(/\[PMTS:([\s\S]*?)\]/) : null;
    let payments = [];
    if (match) {
      try {
        payments = JSON.parse(match[1]);
      } catch(e){}
    }
    const payment = payments[paymentIndex];
    if (payment && payment.receipt_photo) {
      const viewerImg = document.getElementById('viewer-payment-img');
      if (viewerImg) {
        viewerImg.src = payment.receipt_photo;
        document.getElementById('payment-photo-modal').style.display = 'block';
      }
    }
  }
}

async function openEditStockInvoiceModal(invoiceNumber) {
  const movements = await DB.getStockMovements();
  const invoiceMovements = movements.filter(m => m.type === 'supplier_invoice' && m.invoice_number === invoiceNumber);
  
  if (invoiceMovements.length === 0) {
    UI.showToast('Facture non trouvée', 'error');
    return;
  }
  
  const first = invoiceMovements[0];
  document.getElementById('edit-stock-invoice-old-number').value = invoiceNumber;
  document.getElementById('edit-stock-invoice-number').value = invoiceNumber;
  document.getElementById('edit-stock-invoice-discount').value = Number(first.discount_percentage) || 0;
  document.getElementById('edit-stock-invoice-notes').value = first.notes || '';

  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('edit-stock-invoice-modal').style.display = 'block';
}

async function handleEditStockInvoiceSubmit(e) {
  e.preventDefault();
  const oldInvoiceNumber = document.getElementById('edit-stock-invoice-old-number').value;
  const newInvoiceNumber = document.getElementById('edit-stock-invoice-number').value.trim();
  const discountPercentage = Number(document.getElementById('edit-stock-invoice-discount').value) || 0;
  const notes = document.getElementById('edit-stock-invoice-notes').value.trim();

  if (!newInvoiceNumber) {
    UI.showToast('Veuillez entrer un numéro de facture.', 'error');
    return;
  }

  const loader = document.getElementById('loading-overlay');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  try {
    if (loader) loader.style.display = 'flex';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    }
    await DB.updateStockInvoiceMetadata(oldInvoiceNumber, newInvoiceNumber, discountPercentage, notes);
    UI.showToast('msg_save_success', 'success');
    closeActiveModal();
    UI.refreshStock();
  } catch (err) {
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

async function deleteStockInvoice(invoiceNumber) {
  if (confirm(UI.getTranslation('msg_confirm_delete'))) {
    const loader = document.getElementById('loading-overlay');
    try {
      if (loader) loader.style.display = 'flex';
      await DB.deleteStockInvoice(invoiceNumber);
      UI.showToast('msg_delete_success', 'success');
      UI.refreshStock();
    } catch (err) {
      UI.showToast(err.message, 'error');
    } finally {
      if (loader) loader.style.display = 'none';
    }
  }
}

async function showInvoiceDetails(invoiceNumber) {
  const movements = await DB.getStockMovements();
  const invoiceMovements = movements.filter(m => m.type === 'supplier_invoice' && m.invoice_number === invoiceNumber);

  if (invoiceMovements.length === 0) {
    UI.showToast('Facture non trouvée', 'error');
    return;
  }

  const first = invoiceMovements[0];
  const discountPercentage = Number(first.discount_percentage) || 0;

  document.getElementById('detail-invoice-number').textContent = invoiceNumber;
  document.getElementById('detail-invoice-date').textContent = new Date(first.created_at).toLocaleString();
  document.getElementById('detail-invoice-agent').textContent = first.team_members?.full_name || 'Inconnu';
  document.getElementById('detail-invoice-notes').textContent = first.notes || '-';

  const articles = await DB.getArticles();
  let costBrut = 0;

  const tbody = document.getElementById('stock-invoice-details-body');
  tbody.innerHTML = '';

  invoiceMovements.forEach(m => {
    const art = articles.find(a => a.id === m.article_id);
    if (art) {
      const match = m.notes ? m.notes.match(/\[PRICE:([\d.]+)\]/) : null;
      const basePrice = match ? (Number(match[1]) || 0) : (art.category === 'recharge' ? (Number(art.face_value) || 0) : (Number(art.buying_price) || 0));
      costBrut += m.quantity * basePrice;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${m.articles?.name || 'Article'}</strong></td>
      <td class="text-right" style="font-weight:700; color:var(--success);">${m.quantity} Pcs</td>
    `;
    tbody.appendChild(tr);
  });

  const discountAmount = costBrut * (discountPercentage / 100);
  const costNet = Math.max(0, costBrut - discountAmount);

  document.getElementById('detail-invoice-gross').textContent = `${costBrut.toFixed(2)} DH`;
  document.getElementById('detail-invoice-discount').textContent = `${discountPercentage.toFixed(2)}%`;
  document.getElementById('detail-invoice-net').textContent = `${costNet.toFixed(2)} DH`;

  const role = Auth.getUserRole();
  // Populate payments list
  const payments = await DB.getSupplierPayments();
  const invoicePayments = payments.filter(p => p.invoice_number === invoiceNumber);
  const paymentsTbody = document.getElementById('stock-invoice-payments-body');
  if (paymentsTbody) {
    paymentsTbody.innerHTML = '';
    if (invoicePayments.length === 0) {
      paymentsTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Aucun règlement</td></tr>`;
    } else {
      invoicePayments.forEach(p => {
        const tr = document.createElement('tr');
        const photoBtnHtml = p.receipt_photo 
          ? `<button type="button" class="btn btn-outline btn-sm text-success" onclick="viewPaymentPhoto('${p.id}')" style="padding:4px 8px; font-size:0.75rem; margin-right:4px;">Reçu</button>`
          : '';
        const deleteBtnHtml = (role === 'admin' || role === 'supervisor')
          ? `<button type="button" class="btn btn-outline btn-sm text-danger" onclick="deleteSupplierPayment('${p.id}', '${invoiceNumber}')" style="padding:4px 8px; font-size:0.75rem;">Supprimer</button>`
          : '';
        tr.innerHTML = `
          <td>${new Date(p.created_at).toLocaleDateString()}</td>
          <td style="font-weight:600;">${Number(p.amount).toFixed(2)} DH</td>
          <td><span style="font-size:0.8rem;">${p.team_members?.full_name || 'Opérateur'}</span></td>
          <td class="text-right" style="white-space: nowrap;">
            ${photoBtnHtml}
            ${deleteBtnHtml}
          </td>
        `;
        paymentsTbody.appendChild(tr);
      });
    }
  }

  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('stock-invoice-details-modal').style.display = 'block';
}

async function openSupplierPaymentModal(invoiceNumber) {
  const movements = await DB.getStockMovements();
  const invoiceMovements = movements.filter(m => m.type === 'supplier_invoice' && m.invoice_number === invoiceNumber);
  
  if (invoiceMovements.length === 0) {
    UI.showToast('Facture non trouvée', 'error');
    return;
  }

  const first = invoiceMovements[0];
  const discountPercentage = Number(first.discount_percentage) || 0;

  const articles = await DB.getArticles();
  let costBrut = 0;
  invoiceMovements.forEach(m => {
    const art = articles.find(a => a.id === m.article_id);
    if (art) {
      const match = m.notes ? m.notes.match(/\[PRICE:([\d.]+)\]/) : null;
      const basePrice = match ? (Number(match[1]) || 0) : (art.category === 'recharge' ? (Number(art.face_value) || 0) : (Number(art.buying_price) || 0));
      costBrut += m.quantity * basePrice;
    }
  });

  const discountAmount = costBrut * (discountPercentage / 100);
  const costNet = Math.max(0, costBrut - discountAmount);

  const payments = await DB.getSupplierPayments();
  const invoicePayments = payments.filter(p => p.invoice_number === invoiceNumber);
  const totalPaid = invoicePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balance = Math.max(0, costNet - totalPaid);

  document.getElementById('payment-invoice-number').value = invoiceNumber;
  document.getElementById('payment-info-invoice').textContent = invoiceNumber;
  document.getElementById('payment-info-total').textContent = `${costNet.toFixed(2)} DH`;
  document.getElementById('payment-info-paid').textContent = `${totalPaid.toFixed(2)} DH`;
  document.getElementById('payment-info-balance').textContent = `${balance.toFixed(2)} DH`;

  // Reset inputs
  document.getElementById('supplier-payment-form').reset();
  paymentPhotoBase64 = null;
  const previewDiv = document.getElementById('payment-photo-preview');
  if (previewDiv) previewDiv.style.display = 'none';

  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('supplier-payment-modal').style.display = 'block';
}

async function handleSupplierPaymentSubmit(e) {
  e.preventDefault();
  const invoiceNumber = document.getElementById('payment-invoice-number').value;
  const amount = Number(document.getElementById('payment-amount').value) || 0;

  if (amount <= 0) {
    UI.showToast('Veuillez entrer un montant valide.', 'error');
    return;
  }

  if (!paymentPhotoBase64) {
    UI.showToast('Veuillez télécharger une photo de virement/reçu.', 'error');
    return;
  }

  const loader = document.getElementById('loading-overlay');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  try {
    if (loader) loader.style.display = 'flex';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    }

    // Upload photo to Cloudinary first
    let cloudinaryUrl = null;
    try {
      cloudinaryUrl = await DB.uploadToCloudinary(paymentPhotoBase64);
    } catch (uploadErr) {
      console.error(uploadErr);
      throw new Error("Erreur d'upload photo Cloudinary : " + uploadErr.message);
    }

    const user = Auth.getUserProfile();
    const paymentRecord = {
      invoice_number: invoiceNumber,
      amount: amount,
      receipt_photo: cloudinaryUrl,
      employee_id: user.id
    };

    await DB.addSupplierPayment(paymentRecord);
    UI.showToast('msg_save_success', 'success');
    closeActiveModal();
    UI.refreshStock();
  } catch (err) {
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

async function viewPaymentPhoto(paymentId) {
  const payments = await DB.getSupplierPayments();
  const payment = payments.find(p => p.id === paymentId);
  if (payment && payment.receipt_photo) {
    const viewerImg = document.getElementById('viewer-payment-img');
    if (viewerImg) {
      viewerImg.src = payment.receipt_photo;
      document.getElementById('payment-photo-modal').style.display = 'block';
    }
  }
}

function closePaymentPhotoModal() {
  document.getElementById('payment-photo-modal').style.display = 'none';
}

// --- Sales Ticket/Receipt Printer Modal ---
async function showReceipt(saleId) {
  const sales = await DB.getSales();
  const sale = sales.find(s => s.id === saleId);
  if (!sale) return;

  const clients = await DB.getClients();
  const client = clients.find(c => c.id === sale.client_id) || { full_name: 'Client inconnu', dealer_number: '-' };

  const articles = await DB.getArticles();

  // Find group ID to check for multi-item sale
  const match = sale.notes ? sale.notes.match(/^\[GRP-([^\]]+)\]/) : null;
  let groupedSales = [sale];
  if (match) {
    const grpId = match[1];
    groupedSales = sales.filter(s => s.notes && s.notes.startsWith(`[GRP-${grpId}]`));
  }

  // Fill receipt fields
  document.getElementById('receipt-seller-name').textContent = `Vendeur: ${sale.team_members?.full_name || 'Vendeur'}`;
  document.getElementById('receipt-date').textContent = new Date(sale.created_at).toLocaleString();
  document.getElementById('receipt-sale-id').textContent = sale.id.substring(0, 8).toUpperCase();
  document.getElementById('receipt-client-name').textContent = client.full_name;
  document.getElementById('receipt-client-dealer').textContent = client.dealer_number;

  // Clear and populate dynamic items list
  const tbody = document.getElementById('receipt-items-tbody');
  if (tbody) {
    tbody.innerHTML = '';
    
    let grossSum = 0;
    let discountSum = 0;
    let netSum = 0;

    groupedSales.forEach(s => {
      grossSum += Number(s.gross_total) || 0;
      discountSum += Number(s.discount_amount) || 0;
      netSum += Number(s.net_total) || 0;

      const art = articles.find(a => a.id === s.article_id) || { name: 'Recharge' };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${art.name}</td>
        <td>${s.quantity}</td>
        <td>${Number(s.unit_price).toFixed(2)}</td>
        <td style="text-align:right;">${Number(s.gross_total).toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById('receipt-gross').textContent = `${grossSum.toFixed(2)} DH`;
    document.getElementById('receipt-discount').textContent = `${discountSum.toFixed(2)} DH`;
    document.getElementById('receipt-net').textContent = `${netSum.toFixed(2)} DH`;
  }

  document.getElementById('receipt-payment').textContent = UI.getTranslation('opt_' + sale.payment_status).toUpperCase();

  // Generate QR Code
  QR.generate(sale.id, 'receipt-qr');

  // Open Modal
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('receipt-modal').style.display = 'block';
}

function printReceiptTicket() {
  PDF.exportToPDF('printable-receipt', `Ticket_Facture_${Date.now()}.pdf`);
}

// --- Reports Generation Queries ---
async function generateReport() {
  const type = document.getElementById('report-type').value;
  const dateVal = document.getElementById('report-filter-date').value;
  const monthVal = document.getElementById('report-filter-month').value;
  const agentVal = document.getElementById('report-filter-agent').value;
  const sectorVal = document.getElementById('report-filter-sector').value.trim().toLowerCase();

  const sales = await DB.getSales();
  const team = await DB.getTeamMembers();
  
  // Filter sales
  let filtered = sales;

  if (type === 'daily' && dateVal) {
    filtered = filtered.filter(s => getLocalDateStr(s.created_at) === dateVal);
    if (agentVal !== 'all') {
      filtered = filtered.filter(s => s.employee_id === agentVal);
    }
  } else if (type === 'monthly' && monthVal) {
    filtered = filtered.filter(s => getLocalDateStr(s.created_at).substring(0, 7) === monthVal);
  } else if (type === 'sector' && sectorVal) {
    filtered = filtered.filter(s => {
      const seller = team.find(t => t.id === s.employee_id);
      return seller && seller.assigned_sector && seller.assigned_sector.toLowerCase().includes(sectorVal);
    });
  }

  // Calculate totals
  let grossSum = 0;
  let discountSum = 0;
  let netSum = 0;

  filtered.forEach(s => {
    grossSum += Number(s.gross_total) || 0;
    discountSum += Number(s.discount_amount) || 0;
    netSum += Number(s.net_total) || 0;
  });

  // Set headings
  const titleMap = {
    daily: `Rapport Journalier d'Activité`,
    sector: `Rapport Commercial par Secteur`,
    monthly: `Rapport de Ventes Mensuel`
  };
  document.getElementById('report-heading').textContent = UI.getTranslation('opt_rep_' + type) || titleMap[type];
  document.getElementById('report-subheading').textContent = `Filtre: ${type === 'daily' ? dateVal : type === 'monthly' ? monthVal : sectorVal || 'Tous'}`;

  document.getElementById('report-sum-gross').textContent = `${grossSum.toFixed(2)} DH`;
  document.getElementById('report-sum-discount').textContent = `${discountSum.toFixed(2)} DH`;
  document.getElementById('report-sum-net').textContent = `${netSum.toFixed(2)} DH`;

  // Render Table
  const tbody = document.getElementById('report-table-body');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--text-muted);">${UI.getTranslation('msg_no_report_data')}</td></tr>`;
    return;
  }

  filtered.forEach(sale => {
    const discStr = sale.discount_type === 'percentage' 
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
      <td>${Number(sale.unit_price).toFixed(2)} DH</td>
      <td>${Number(sale.gross_total).toFixed(2)} DH</td>
      <td class="text-amber">${discStr}</td>
      <td class="text-success" style="font-weight:700;">${Number(sale.net_total).toFixed(2)} DH</td>
      <td><span class="badge ${sale.payment_status === 'paid' ? 'badge-success' : sale.payment_status === 'unpaid' ? 'badge-crimson' : 'badge-amber'}">${UI.getTranslation('opt_' + sale.payment_status)}</span></td>
      <td>${sale.team_members?.full_name || 'Vendeur'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function exportReportPDF() {
  const type = document.getElementById('report-type').value;
  PDF.exportToPDF('printable-report-area', `Rapport_Ventes_${type}_${Date.now()}.pdf`);
}

async function exportReportCSV() {
  const type = document.getElementById('report-type').value;
  const rows = [];
  const headers = ['Date', 'Client', 'Article', 'Quantité', 'Prix Unitaire', 'Total Brut', 'Montant Remise', 'Total Net', 'Paiement', 'Vendeur'];
  
  const tbody = document.getElementById('report-table-body');
  tbody.querySelectorAll('tr').forEach(tr => {
    const cells = [];
    tr.querySelectorAll('td').forEach(td => {
      cells.push(td.textContent.trim());
    });
    if (cells.length === 10) {
      rows.push(cells);
    }
  });

  PDF.exportToCSV(headers, rows, `Rapport_CSV_${type}_${Date.now()}.csv`);
}

async function exportSalesCSV() {
  const sales = await DB.getSales();
  const headers = ['Date/Heure', 'Client', 'Article', 'Quantité', 'Prix Unitaire (DH)', 'Total Brut (DH)', 'Type Remise', 'Valeur Remise', 'Montant Remise (DH)', 'Total Net (DH)', 'Paiement', 'Notes', 'Vendeur'];
  
  const rows = sales.map(s => [
    new Date(s.created_at).toISOString(),
    s.clients?.full_name || 'Client',
    s.articles?.name || 'Recharge',
    s.quantity,
    s.unit_price,
    s.gross_total,
    s.discount_type,
    s.discount_value,
    s.discount_amount,
    s.net_total,
    s.payment_status,
    s.notes || '',
    s.team_members?.full_name || ''
  ]);

  PDF.exportToCSV(headers, rows, `Sales_Export_${Date.now()}.csv`);
}

async function exportClientsCSV() {
  const clients = await DB.getClients();
  const headers = ['Nom Complet', 'Téléphone', 'Numéro Dealer', 'Type Activité', 'Adresse', 'Latitude', 'Longitude', 'Notes'];
  
  const rows = clients.map(c => [
    c.full_name || '',
    c.phone_number || '',
    c.dealer_number || '',
    c.activity_type || '',
    c.address || '',
    c.latitude || '',
    c.longitude || '',
    c.notes || ''
  ]);

  PDF.exportToCSV(headers, rows, `Clients_Export_${Date.now()}.csv`);
}

// --- Configuration View Actions ---
function saveSettings() {
  const url = document.getElementById('setting-supabase-url').value.trim();
  const key = document.getElementById('setting-supabase-key').value.trim();
  
  if (url && key) {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);
    UI.showToast('Identifiants sauvegardés. Rechargement...', 'success');
  } else {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
    UI.showToast('Passage en mode Démo local. Rechargement...', 'success');
  }
  
  setTimeout(() => window.location.reload(), 1500);
}

function clearLocalDatabase() {
  if (confirm(UI.getTranslation('msg_confirm_clear_db'))) {
    localStorage.clear();
    sessionStorage.clear();
    UI.showToast('Base de données locale effacée.', 'success');
    setTimeout(() => window.location.reload(), 1500);
  }
}

function saveLocalSettings() {
  const rechargesInput = document.getElementById('setting-monthly-recharges-goal');
  const simsInput = document.getElementById('setting-monthly-sims-goal');

  if (rechargesInput && simsInput) {
    const rechargesVal = parseFloat(rechargesInput.value);
    const simsVal = parseInt(simsInput.value, 10);

    if (isNaN(rechargesVal) || rechargesVal < 0 || isNaN(simsVal) || simsVal < 0) {
      UI.showToast('Veuillez entrer des objectifs valides.', 'error');
      return;
    }

    localStorage.setItem('rs_monthly_recharges_goal', rechargesVal.toString());
    localStorage.setItem('rs_monthly_sims_goal', simsVal.toString());

    UI.showToast('Objectifs sauvegardés avec succès !', 'success');
    UI.initDashboard();
  }
}

// --- Local filters helpers ---
function filterClientsTable() {
  const query = document.getElementById('client-search').value.toLowerCase();
  const trs = document.getElementById('clients-table-body').querySelectorAll('tr');
  
  trs.forEach(tr => {
    const text = tr.textContent.toLowerCase();
    tr.style.display = text.includes(query) ? '' : 'none';
  });
}

function filterSalesTable() {
  const query = document.getElementById('sales-search').value.toLowerCase().trim();
  const payFilter = document.getElementById('sales-filter-payment').value;
  const catFilter = document.getElementById('sales-filter-category').value;
  
  const body = document.getElementById('sales-table-body');
  if (!body) return;
  
  const headers = body.querySelectorAll('tr.group-header');
  const children = body.querySelectorAll('tr.group-child');

  // 1. Filter child rows first
  children.forEach(tr => {
    const clientName = (tr.getAttribute('data-client-name') || '').toLowerCase();
    const clientPhone = (tr.getAttribute('data-client-phone') || '').toLowerCase();
    const notes = (tr.getAttribute('data-notes') || '').toLowerCase();
    const text = tr.textContent.toLowerCase();
    
    const matchesQuery = !query || clientName.includes(query) || 
                         clientPhone.includes(query) || 
                         text.includes(query) || 
                         notes.includes(query);
    
    // Check payment matching
    let matchesPayment = true;
    if (payFilter !== 'all') {
      const payBadge = tr.querySelector('.badge').textContent.toLowerCase();
      matchesPayment = payBadge === UI.getTranslation('opt_' + payFilter).toLowerCase();
    }

    // Check category matching
    let matchesCategory = true;
    if (catFilter !== 'all') {
      const rowCategory = tr.getAttribute('data-category') || '';
      matchesCategory = rowCategory === catFilter;
    }

    const matchesAll = matchesQuery && matchesPayment && matchesCategory;
    tr.dataset.matches = matchesAll ? 'true' : 'false';
    tr.style.display = 'none'; // hidden by default
  });

  // 2. Filter and display headers based on matching children
  headers.forEach(header => {
    const clientId = header.getAttribute('data-client-id');
    const headerClientName = (header.getAttribute('data-client-name') || '').toLowerCase();
    const headerClientPhone = (header.getAttribute('data-client-phone') || '').toLowerCase();
    
    const matchesHeaderQuery = !query || headerClientName.includes(query) || headerClientPhone.includes(query);
    
    const relatedChildren = Array.from(children).filter(c => c.getAttribute('data-client-id') === clientId);
    const hasMatchingChildren = relatedChildren.some(c => c.dataset.matches === 'true');

    const groupMatches = (matchesHeaderQuery || hasMatchingChildren) && (relatedChildren.length === 0 || hasMatchingChildren);

    if (groupMatches) {
      header.style.display = '';
      const isExpanded = header.classList.contains('expanded');
      relatedChildren.forEach(c => {
        if (c.dataset.matches === 'true' && isExpanded) {
          c.style.display = '';
        } else {
          c.style.display = 'none';
        }
      });
    } else {
      header.style.display = 'none';
      relatedChildren.forEach(c => {
        c.style.display = 'none';
      });
    }
  });
}

function toggleClientGroup(clientId) {
  const header = document.querySelector(`.group-header[data-client-id="${clientId}"]`);
  if (!header) return;
  
  header.classList.toggle('expanded');
  filterSalesTable();
}

window.toggleClientGroup = toggleClientGroup;

async function openObjectivesModal() {
  const tableBody = document.getElementById('objectives-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Chargement...</td></tr>';
  
  // Show Modal
  const modal = document.getElementById('manage-objectives-modal');
  if (modal) modal.style.display = 'block';

  try {
    const team = await DB.getTeamMembers();
    const employees = team.filter(member => member.role === 'employee');

    if (employees.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-center" style="color:var(--text-muted);">Aucun vendeur trouvé.</td></tr>';
      return;
    }

    tableBody.innerHTML = '';
    employees.forEach(member => {
      const storedRecharges = localStorage.getItem('rs_goal_recharges_' + member.id) || '5000.00';
      const storedSims = localStorage.getItem('rs_goal_sims_' + member.id) || '100';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 12px 8px; vertical-align: middle;">
          <strong>${member.full_name}</strong><br>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">${member.email}</span>
        </td>
        <td style="padding: 8px;">
          <input type="number" id="obj-recharges-${member.id}" class="btn-outline" style="width:100%; padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary);" value="${storedRecharges}" min="0" step="any">
        </td>
        <td style="padding: 8px;">
          <input type="number" id="obj-sims-${member.id}" class="btn-outline" style="width:100%; padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary);" value="${storedSims}" min="0" step="1">
        </td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading seller objectives:', err);
    tableBody.innerHTML = '<tr><td colspan="3" class="text-center" style="color:var(--crimson);">Erreur lors du chargement des vendeurs.</td></tr>';
  }
}

async function saveSellersObjectives() {
  try {
    const team = await DB.getTeamMembers();
    const employees = team.filter(member => member.role === 'employee');

    for (const member of employees) {
      const rechargesInput = document.getElementById(`obj-recharges-${member.id}`);
      const simsInput = document.getElementById(`obj-sims-${member.id}`);

      if (rechargesInput && simsInput) {
        const rechargesVal = parseFloat(rechargesInput.value);
        const simsVal = parseInt(simsInput.value, 10);

        if (isNaN(rechargesVal) || rechargesVal < 0 || isNaN(simsVal) || simsVal < 0) {
          UI.showToast('Veuillez entrer des objectifs valides pour tous les vendeurs.', 'error');
          return;
        }

        localStorage.setItem('rs_goal_recharges_' + member.id, rechargesVal.toString());
        localStorage.setItem('rs_goal_sims_' + member.id, simsVal.toString());

        await DB.updateTeamMember(member.id, {
          monthly_recharges_goal: rechargesVal,
          monthly_sims_goal: simsVal
        });
      }
    }

    UI.showToast('Objectifs sauvegardés avec succès !', 'success');
    closeActiveModal();
    UI.initDashboard();
  } catch (err) {
    console.error('Error saving seller objectives:', err);
    UI.showToast('Erreur lors de la sauvegarde.', 'error');
  }
}

// Close active modal helper
function closeActiveModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('sales-modal').style.display = 'none';
  document.getElementById('client-modal').style.display = 'none';
  document.getElementById('team-modal').style.display = 'none';
  document.getElementById('stock-modal').style.display = 'none';
  document.getElementById('receipt-modal').style.display = 'none';
  
  const creditPaymentModal = document.getElementById('credit-payment-modal');
  if (creditPaymentModal) creditPaymentModal.style.display = 'none';
  const stockInvoiceModal = document.getElementById('stock-invoice-modal');
  if (stockInvoiceModal) stockInvoiceModal.style.display = 'none';
  const stockInvoiceDetailsModal = document.getElementById('stock-invoice-details-modal');
  if (stockInvoiceDetailsModal) stockInvoiceDetailsModal.style.display = 'none';
  const supplierPaymentModal = document.getElementById('supplier-payment-modal');
  if (supplierPaymentModal) supplierPaymentModal.style.display = 'none';
  const editStockInvoiceModal = document.getElementById('edit-stock-invoice-modal');
  if (editStockInvoiceModal) editStockInvoiceModal.style.display = 'none';
  const stockTransferModal = document.getElementById('stock-transfer-modal');
  if (stockTransferModal) stockTransferModal.style.display = 'none';
  const manageObjectivesModal = document.getElementById('manage-objectives-modal');
  if (manageObjectivesModal) manageObjectivesModal.style.display = 'none';
  const qrScannerModal = document.getElementById('qr-scanner-modal');
  if (qrScannerModal && qrScannerModal.style.display !== 'none') closeQRScanner();
  const clientQrModal = document.getElementById('client-qr-modal');
  if (clientQrModal) clientQrModal.style.display = 'none';
}

window.openClientModal = openClientModal;
window.openSalesModal = openSalesModal;
window.openStockMovementModal = openStockMovementModal;
window.openStockInvoiceModal = openStockInvoiceModal;
window.showInvoiceDetails = showInvoiceDetails;
window.openSupplierPaymentModal = openSupplierPaymentModal;
window.openEditStockInvoiceModal = openEditStockInvoiceModal;
window.deleteStockInvoice = deleteStockInvoice;
window.detectGPS = detectGPS;
window.openQRScanner = openQRScanner;
window.closeQRScanner = closeQRScanner;
window.viewClientQR = viewClientQR;
window.closeClientQRModal = closeClientQRModal;
window.printClientQR = printClientQR;
window.viewPaymentPhoto = viewPaymentPhoto;
window.closePaymentPhotoModal = closePaymentPhotoModal;
window.openTeamModal = openTeamModal;
window.closeActiveModal = closeActiveModal;
window.openStockTransferModal = openStockTransferModal;
window.onTransferSourceOrArticleChanged = onTransferSourceOrArticleChanged;
window.viewCreditPaymentPhoto = viewCreditPaymentPhoto;
window.changeCalendarMonth = (direction) => UI.changeCalendarMonth(direction);
window.addSaleItemRow = addSaleItemRow;
window.removeSaleItemRow = removeSaleItemRow;
window.onSaleItemArticleChanged = onSaleItemArticleChanged;
window.calculateSaleTotals = calculateSaleTotals;
window.triggerLogout = triggerLogout;
window.openObjectivesModal = openObjectivesModal;
window.saveSellersObjectives = saveSellersObjectives;
window.switchLanguage = (lang) => UI.switchLanguage(lang);
window.toggleTheme = () => UI.toggleTheme();
window.showReceipt = showReceipt;
window.printReceiptTicket = printReceiptTicket;
window.generateReport = generateReport;
window.exportReportPDF = exportReportPDF;
window.exportReportCSV = exportReportCSV;
window.exportSalesCSV = exportSalesCSV;
window.exportClientsCSV = exportClientsCSV;
window.saveSettings = saveSettings;
window.saveLocalSettings = saveLocalSettings;
window.clearLocalDatabase = clearLocalDatabase;
window.filterClientsTable = filterClientsTable;
window.filterSalesTable = filterSalesTable;
window.updateReportFilters = () => UI.updateReportFilters();
window.quickLogin = quickLogin;

// --- Clients Excel/CSV Import ---
window.triggerClientImport = () => {
  const fileInput = document.getElementById('client-import-input');
  if (fileInput) fileInput.click();
};

window.handleClientImport = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      if (typeof XLSX === 'undefined') {
        UI.showToast("Erreur: Le parser Excel (SheetJS) n'est pas chargé.", "error");
        return;
      }
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      let sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Delimiter fallback for CSV: if parsed as a single column but contains separators (e.g. semicolon, comma, tab)
      if (sheetRows.length > 0 && sheetRows[0].length === 1) {
        const firstCell = String(sheetRows[0][0]);
        let delimiter = null;
        if (firstCell.includes(';')) delimiter = ';';
        else if (firstCell.includes(',')) delimiter = ',';
        else if (firstCell.includes('\t')) delimiter = '\t';
        
        if (delimiter) {
          sheetRows = sheetRows.map(row => {
            if (!row || row.length === 0) return [];
            return String(row[0]).split(delimiter).map(cell => cell.replace(/^["']|["']$/g, '').trim());
          });
        }
      }
      
      if (sheetRows.length <= 1) {
        UI.showToast("Le fichier est vide ou ne contient pas de données.", "error");
        return;
      }
      
      const headers = sheetRows[0];
      let nameIdx = -1, phoneIdx = -1, dealerIdx = -1, activityIdx = -1, addressIdx = -1, latIdx = -1, lngIdx = -1, notesIdx = -1;
      
      headers.forEach((h, idx) => {
        if (!h) return;
        const s = String(h).toLowerCase().trim();
        if (s.includes('nom') || s.includes('name') || s.includes('client') || s.includes('fullname')) nameIdx = idx;
        else if (s.includes('tel') || s.includes('phone') || s.includes('gsm') || s.includes('téléphone') || s.includes('telephone')) phoneIdx = idx;
        else if (s.includes('dealer') || s.includes('code') || s.includes('numéro dealer') || s.includes('numero dealer')) dealerIdx = idx;
        else if (s.includes('activit') || s.includes('type') || s.includes('activity')) activityIdx = idx;
        else if (s.includes('adresse') || s.includes('address') || s.includes('lieu')) addressIdx = idx;
        else if (s.includes('lat') || s.includes('latitude') || s.includes('gps_x') || s === 'x') latIdx = idx;
        else if (s.includes('lng') || s.includes('longitude') || s.includes('lon') || s.includes('gps_y') || s === 'y') lngIdx = idx;
        else if (s.includes('note') || s.includes('obs') || s.includes('info')) notesIdx = idx;
      });
      
      // Fallback column mappings if headers are unmapped but column count matches typical structure
      if (nameIdx === -1 && headers.length > 0) nameIdx = 0;
      if (phoneIdx === -1 && headers.length > 1) phoneIdx = 1;
      if (dealerIdx === -1 && headers.length > 2) dealerIdx = 2;
      if (activityIdx === -1 && headers.length > 3) activityIdx = 3;
      if (addressIdx === -1 && headers.length > 4) addressIdx = 4;
      
      const clientsToImport = [];
      const user = Auth.getUserProfile();
      
      for (let r = 1; r < sheetRows.length; r++) {
        const row = sheetRows[r];
        if (!row || row.length === 0) continue;
        
        const full_name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : '';
        if (!full_name) continue; // Full name is mandatory, skip empty rows
        
        const phone_number = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '0600000000';
        const dealer_number = dealerIdx !== -1 && row[dealerIdx] ? String(row[dealerIdx]).trim() : 'DL-' + Math.floor(1000 + Math.random() * 9000);
        
        let activity_type = 'BT';
        if (activityIdx !== -1 && row[activityIdx]) {
          const s = String(row[activityIdx]).toLowerCase().trim();
          if (s.includes('aliment') || s.includes('general') || s === 'ag') activity_type = 'AG';
          else if (s.includes('tabac') || s.includes('tobac') || s === 'bt') activity_type = 'BT';
          else if (s.includes('librair') || s.includes('papet') || s.includes('makat') || s.includes('service') || s === 'lp') activity_type = 'LP';
          else if (s.includes('portab') || s.includes('access') || s === 'vpa') activity_type = 'VPA';
          else if (s.includes('kios') || s === 'ky') activity_type = 'KY';
        }
        
        const address = addressIdx !== -1 && row[addressIdx] ? String(row[addressIdx]).trim() : '';
        const latitude = latIdx !== -1 && row[latIdx] && !isNaN(row[latIdx]) ? Number(row[latIdx]) : null;
        const longitude = lngIdx !== -1 && row[lngIdx] && !isNaN(row[lngIdx]) ? Number(row[lngIdx]) : null;
        const notes = notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]).trim() : '';
        
        clientsToImport.push({
          full_name,
          phone_number,
          dealer_number,
          activity_type,
          address,
          latitude,
          longitude,
          notes,
          created_by: user ? user.id : null
        });
      }
      
      if (clientsToImport.length === 0) {
        UI.showToast('Aucun client valide trouvé.', 'error');
        return;
      }
      
      window.tempImportedClients = clientsToImport;
      
      // Populate preview modal
      const isArabic = UI.getActiveLanguage() === 'ar';
      const summaryText = isArabic 
        ? `تم العثور على ${clientsToImport.length} زبون في الملف. هل تريد تأكيد استيرادهم؟`
        : `${clientsToImport.length} clients valides trouvés. Voulez-vous confirmer l'importation ?`;
      
      document.getElementById('client-import-summary').textContent = summaryText;
      
      const tbody = document.getElementById('client-import-table-body');
      tbody.innerHTML = '';
      
      // Show first 5 records in preview table
      clientsToImport.slice(0, 5).forEach(c => {
        const tr = document.createElement('tr');
        const activityLabel = UI.getTranslation('activity_' + c.activity_type.toLowerCase()) || c.activity_type;
        tr.innerHTML = `
          <td><strong>${c.full_name}</strong></td>
          <td>${c.phone_number}</td>
          <td>${c.dealer_number}</td>
          <td>${activityLabel}</td>
          <td>${c.address || '-'}</td>
        `;
        tbody.appendChild(tr);
      });
      
      if (clientsToImport.length > 5) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" style="text-align:center; color:var(--text-muted); font-style:italic;">+ ${clientsToImport.length - 5} autres clients...</td>`;
        tbody.appendChild(tr);
      }
      
      // Populate vendor dropdown for import
      const importSellerSelect = document.getElementById('import-vendeur-id');
      const importAssignGroup = document.getElementById('import-assign-group');
      if (importSellerSelect) {
        importSellerSelect.innerHTML = '<option value="">-- Laisser vide / Non assigné --</option>';
        const team = await DB.getTeamMembers();
        const activeEmployees = team.filter(t => t.role === 'employee' && t.is_active);
        activeEmployees.forEach(emp => {
          const opt = document.createElement('option');
          opt.value = emp.id;
          opt.textContent = emp.full_name;
          importSellerSelect.appendChild(opt);
        });

        const role = Auth.getUserRole();
        const user = Auth.getUserProfile();
        if (role === 'employee' && user) {
          if (importAssignGroup) importAssignGroup.style.display = 'none';
          importSellerSelect.value = user.id;
        } else {
          if (importAssignGroup) importAssignGroup.style.display = 'block';
          importSellerSelect.value = '';
        }
      }

      // Open preview modal
      document.getElementById('modal-overlay').style.display = 'block';
      document.getElementById('client-import-modal').style.display = 'block';
      
      // Reset input element value
      event.target.value = '';
      
    } catch (err) {
      console.error(err);
      UI.showToast("Erreur lors du traitement du fichier.", "error");
    }
  };
  reader.readAsArrayBuffer(file);
};

window.confirmClientImport = async () => {
  if (!window.tempImportedClients || window.tempImportedClients.length === 0) return;
  
  const loader = document.getElementById('loading-overlay');
  const submitBtn = document.querySelector('#client-import-modal button.btn-primary');
  try {
    if (loader) loader.style.display = 'flex';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    }

    const selectedSellerId = document.getElementById('import-vendeur-id')?.value;
    if (selectedSellerId) {
      window.tempImportedClients.forEach(c => {
        c.created_by = selectedSellerId;
      });
    }
    
    await DB.addClients(window.tempImportedClients);
    UI.showToast("Importation réussie avec succès !", "success");
    closeActiveModal();
    UI.refreshClients();
  } catch (err) {
    console.error(err);
    UI.showToast(err.message || "Erreur d'importation", "error");
  } finally {
    if (loader) loader.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
    window.tempImportedClients = null;
  }
};

window.toggleSaleInitialPaidField = () => {
  const status = document.getElementById('sale-payment-status').value;
  const group = document.getElementById('sale-initial-paid-group');
  if (group) {
    group.style.display = status === 'partial' ? 'block' : 'none';
    if (status !== 'partial') {
      const input = document.getElementById('sale-initial-paid');
      if (input) input.value = '0';
    }
  }
};

async function markSaleAsPaidDirectly(saleId) {
  if (!confirm(UI.getTranslation('msg_confirm_pay_credit'))) {
    return;
  }

  const loader = document.getElementById('loading-overlay');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  try {
    if (loader) loader.style.display = 'flex';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    }

    const sales = await DB.getSales();
    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
      throw new Error('Vente non trouvée');
    }

    const match = sale.notes ? sale.notes.match(/\[PMTS:([\s\S]*?)\]/) : null;
    let parsedPayments = [];
    if (match) {
      try {
        parsedPayments = JSON.parse(match[1]);
      } catch(e){}
    }

    const totalPaid = parsedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const netTotal = Number(sale.net_total) || 0;
    const balance = Math.max(0, netTotal - totalPaid);

    if (balance > 0) {
      const newPayment = {
        amount: balance,
        method: 'especes',
        created_at: new Date().toISOString(),
        receipt_photo: null
      };
      parsedPayments.push(newPayment);
    }

    let originalNotes = sale.notes || '';
    const cleanNotes = originalNotes.replace(/\[PMTS:[\s\S]*?\]/, '').trim();
    const newNotes = `[PMTS:${JSON.stringify(parsedPayments)}] ${cleanNotes}`.trim();

    await DB.updateSale(saleId, {
      payment_status: 'paid',
      notes: newNotes
    });

    UI.showToast('msg_save_success', 'success');
    
    // Refresh tables
    await UI.refreshSales();
    await UI.refreshCredits();
  } catch (err) {
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

async function deleteSaleRecord(saleId) {
  const isArabic = UI.getActiveLanguage() === 'ar';
  const confirmMsg = isArabic 
    ? "هل أنت متأكد من حذف هذه المبيعات؟ هذا الإجراء سيسترجع أيضاً مخزون السلع." 
    : "Êtes-vous sûr de vouloir supprimer cette vente ? Cette action rétablira également le stock d'articles.";
  
  if (!confirm(confirmMsg)) {
    return;
  }

  const loader = document.getElementById('loading-overlay');
  try {
    if (loader) loader.style.display = 'flex';
    
    await DB.deleteSale(saleId);
    
    const successMsg = isArabic ? "تم حذف المبيعات بنجاح واسترجاع المخزون." : "Vente supprimée avec succès et stock rétabli.";
    UI.showToast(successMsg, 'success');
    
    // Refresh the views
    await UI.refreshSales();
    await UI.refreshStock();
    await UI.initDashboard();
  } catch (err) {
    console.error(err);
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

window.deleteSaleRecord = deleteSaleRecord;
window.markSaleAsPaidDirectly = markSaleAsPaidDirectly;

window.openCreditPaymentModal = async (saleId) => {
  const sales = await DB.getSales();
  const sale = sales.find(s => s.id === saleId);
  if (!sale) {
    UI.showToast('Vente non trouvée', 'error');
    return;
  }

  const match = sale.notes ? sale.notes.match(/\[PMTS:([\s\S]*?)\]/) : null;
  let parsedPayments = [];
  if (match) {
    try {
      parsedPayments = JSON.parse(match[1]);
    } catch(e){}
  }

  let totalPaid = 0;
  if (sale.payment_status === 'paid') {
    totalPaid = Number(sale.net_total) || 0;
  } else {
    totalPaid = parsedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }

  const balance = Math.max(0, (Number(sale.net_total) || 0) - totalPaid);

  document.getElementById('credit-payment-sale-id').value = saleId;
  document.getElementById('credit-info-client').textContent = sale.clients?.full_name || 'Client';
  document.getElementById('credit-info-total').textContent = `${(Number(sale.net_total) || 0).toFixed(2)} DH`;
  document.getElementById('credit-info-paid').textContent = `${totalPaid.toFixed(2)} DH`;
  document.getElementById('credit-info-balance').textContent = `${balance.toFixed(2)} DH`;

  document.getElementById('credit-payment-form').reset();
  creditPaymentPhotoBase64 = null;
  document.getElementById('credit-payment-photo-group').style.display = 'none';
  document.getElementById('credit-payment-photo-preview').style.display = 'none';

  const historyContainer = document.getElementById('credit-payments-history-container');
  const historyBody = document.getElementById('credit-payments-history-body');
  if (historyContainer && historyBody) {
    historyBody.innerHTML = '';
    if (parsedPayments.length > 0) {
      historyContainer.style.display = 'block';
      parsedPayments.forEach((p, idx) => {
        const tr = document.createElement('tr');
        const photoBtnHtml = p.receipt_photo 
          ? `<button type="button" class="btn btn-outline btn-sm text-success" onclick="viewCreditPaymentPhoto('${saleId}', ${idx})" style="padding:2px 6px; font-size:0.7rem;">Reçu</button>`
          : '-';
        tr.innerHTML = `
          <td>${new Date(p.created_at).toLocaleDateString()}</td>
          <td style="font-weight:600;">${Number(p.amount).toFixed(2)} DH</td>
          <td>${p.method === 'virement' ? 'Virement' : 'Espèces'}</td>
          <td class="text-right">${photoBtnHtml}</td>
        `;
        historyBody.appendChild(tr);
      });
    } else {
      historyContainer.style.display = 'none';
    }
  }

  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('credit-payment-modal').style.display = 'block';
};

window.onCreditPaymentMethodChanged = () => {
  const method = document.getElementById('credit-payment-method').value;
  const photoGroup = document.getElementById('credit-payment-photo-group');
  const photoInput = document.getElementById('credit-payment-photo');
  if (photoGroup && photoInput) {
    if (method === 'virement') {
      photoGroup.style.display = 'block';
      photoInput.required = true;
    } else {
      photoGroup.style.display = 'none';
      photoInput.required = false;
    }
  }
};

async function handleCreditPaymentSubmit(e) {
  e.preventDefault();
  const saleId = document.getElementById('credit-payment-sale-id').value;
  const amount = Number(document.getElementById('credit-payment-amount').value) || 0;
  const method = document.getElementById('credit-payment-method').value;

  if (amount <= 0) {
    UI.showToast('Veuillez entrer un montant valide.', 'error');
    return;
  }

  if (method === 'virement' && !creditPaymentPhotoBase64) {
    UI.showToast('Veuillez télécharger une photo de virement/reçu.', 'error');
    return;
  }

  const loader = document.getElementById('loading-overlay');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  try {
    if (loader) loader.style.display = 'flex';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    }

    const sales = await DB.getSales();
    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
      UI.showToast('Vente non trouvée', 'error');
      return;
    }

    // Upload photo to Cloudinary first if method is virement
    let cloudinaryUrl = null;
    if (method === 'virement' && creditPaymentPhotoBase64) {
      try {
        cloudinaryUrl = await DB.uploadToCloudinary(creditPaymentPhotoBase64);
      } catch (uploadErr) {
        console.error(uploadErr);
        throw new Error("Erreur d'upload photo Cloudinary : " + uploadErr.message);
      }
    }

    const match = sale.notes ? sale.notes.match(/\[PMTS:([\s\S]*?)\]/) : null;
    let parsedPayments = [];
    if (match) {
      try {
        parsedPayments = JSON.parse(match[1]);
      } catch(e){}
    }

    const newPayment = {
      amount: amount,
      method: method,
      created_at: new Date().toISOString(),
      receipt_photo: cloudinaryUrl
    };
    parsedPayments.push(newPayment);

    const totalPaid = parsedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const netTotal = Number(sale.net_total) || 0;
    const balance = Math.max(0, netTotal - totalPaid);

    let newStatus = 'partial';
    if (balance <= 0) {
      newStatus = 'paid';
    }

    let originalNotes = sale.notes || '';
    const cleanNotes = originalNotes.replace(/\[PMTS:[\s\S]*?\]/, '').trim();
    const newNotes = `[PMTS:${JSON.stringify(parsedPayments)}] ${cleanNotes}`.trim();

    await DB.updateSale(saleId, {
      payment_status: newStatus,
      notes: newNotes
    });

    UI.showToast('msg_save_success', 'success');
    
    // Refresh tables to ensure UI data updates immediately
    await UI.refreshSales();
    await UI.refreshCredits();
    
    closeActiveModal();
    navigateTo('credits');
  } catch (err) {
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

function openMobileMoreSheet() {
  const sheet = document.getElementById('mobile-more-sheet');
  if (sheet) sheet.style.display = 'block';
}

function closeMobileMoreSheet() {
  const sheet = document.getElementById('mobile-more-sheet');
  if (sheet) sheet.style.display = 'none';
}

async function changeUserPassword() {
  const oldPassword = document.getElementById('setting-old-password').value.trim();
  const newPassword = document.getElementById('setting-new-password').value.trim();
  const confirmPassword = document.getElementById('setting-confirm-password').value.trim();

  if (!oldPassword || !newPassword || !confirmPassword) {
    UI.showToast('Veuillez remplir tous les champs.', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    UI.showToast('Les nouveaux mots de passe ne correspondent pas.', 'error');
    return;
  }

  if (newPassword.length < 6) {
    UI.showToast('Le mot de passe doit contenir au moins 6 caractères.', 'error');
    return;
  }

  const loader = document.getElementById('loading-overlay');
  const submitBtn = document.querySelector('#settings-password-card button.btn-primary');
  try {
    if (loader) loader.style.display = 'flex';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    }

    if (DB.getUseSupabase()) {
      const client = DB.getSupabaseClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }
      const email = user.email;

      // Background re-authentication to verify old password
      const { error: signInError } = await client.auth.signInWithPassword({
        email: email,
        password: oldPassword
      });
      if (signInError) {
        throw new Error('Ancien mot de passe incorrect.');
      }

      // Update password
      const { error: updateError } = await client.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
    } else {
      // Local storage mode
      const profile = Auth.getUserProfile();
      const localTeam = JSON.parse(localStorage.getItem('team_members')) || [];
      const idx = localTeam.findIndex(t => t.id === profile.id);
      if (idx !== -1) {
        const currentPassword = localTeam[idx].password || '123456';
        if (oldPassword !== currentPassword) {
          throw new Error('Ancien mot de passe incorrect.');
        }
        localTeam[idx].password = newPassword;
        localStorage.setItem('team_members', JSON.stringify(localTeam));
        // Update active profile in memory
        profile.password = newPassword;
        Auth.updateProfile(profile);
      } else {
        throw new Error('Utilisateur non trouvé.');
      }
    }

    UI.showToast('Mot de passe mis à jour avec succès.', 'success');
    document.getElementById('setting-old-password').value = '';
    document.getElementById('setting-new-password').value = '';
    document.getElementById('setting-confirm-password').value = '';
  } catch (err) {
    UI.showToast(err.message, 'error');
  } finally {
    if (loader) loader.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

window.openMobileMoreSheet = openMobileMoreSheet;
window.closeMobileMoreSheet = closeMobileMoreSheet;
window.changeUserPassword = changeUserPassword;

async function deleteSupplierPayment(paymentId, invoiceNumber) {
  if (!confirm(UI.getTranslation('msg_confirm_delete') || 'Voulez-vous vraiment supprimer ce règlement ?')) {
    return;
  }

  const loader = document.getElementById('loading-overlay');
  try {
    if (loader) loader.style.display = 'flex';
    await DB.deleteSupplierPayment(paymentId);
    UI.showToast('msg_delete_success', 'success');
    
    // Refresh stock view to recalculate invoice total/balance
    await UI.refreshStock();
    
    // Refresh the open details modal
    if (typeof showInvoiceDetails === 'function') {
      await showInvoiceDetails(invoiceNumber);
    }
  } catch (err) {
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

window.deleteSupplierPayment = deleteSupplierPayment;