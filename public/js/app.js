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
        const reader = new FileReader();
        reader.onload = (event) => {
          paymentPhotoBase64 = event.target.result;
          const previewImg = document.getElementById('payment-preview-img');
          const previewDiv = document.getElementById('payment-photo-preview');
          if (previewImg && previewDiv) {
            previewImg.src = paymentPhotoBase64;
            previewDiv.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const creditPhotoInput = document.getElementById('credit-payment-photo');
  if (creditPhotoInput) {
    creditPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          creditPaymentPhotoBase64 = event.target.result;
          const previewImg = document.getElementById('credit-preview-img');
          const previewDiv = document.getElementById('credit-payment-photo-preview');
          if (previewImg && previewDiv) {
            previewImg.src = creditPaymentPhotoBase64;
            previewDiv.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
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
    document.getElementById('auth-view').style.display = 'block';
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

  document.getElementById('auth-view').style.display = 'none';
  document.getElementById('app-view').style.display = 'grid';

  // Fill user profile labels
  document.getElementById('header-username').textContent = profile.full_name;
  
  const roleTag = document.getElementById('header-user-role');
  roleTag.textContent = UI.getTranslation('role_' + role);
  roleTag.className = `role-tag ${role === 'admin' ? 'admin' : 'employee'}`;

  // Hide team links or admin settings if roles are employee
  const teamLink = document.getElementById('nav-team-link');
  if (teamLink) {
    teamLink.style.display = role === 'employee' ? 'none' : 'flex';
  }

  const reportsLink = document.querySelector('[data-nav="reports"]');
  if (reportsLink) {
    reportsLink.style.display = role === 'employee' ? 'none' : 'flex';
  }

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

  // Load Settings input boxes
  const storedUrl = localStorage.getItem('supabase_url') || 'https://rzubtzpqdxanygzkquko.supabase.co';
  const storedKey = localStorage.getItem('supabase_key') || 'sb_publishable_GY2IDrcWN7G1cCaE_dThYg_RMwARiqp';
  document.getElementById('setting-supabase-url').value = storedUrl;
  document.getElementById('setting-supabase-key').value = storedKey;

  // Render dashboard elements
  navigateTo('dashboard');
  
  if (loader) loader.style.display = 'none';
}

// Trigger Logout session
async function triggerLogout() {
  await Auth.logout();
  document.getElementById('auth-view').style.display = 'block';
  document.getElementById('app-view').style.display = 'none';
  UI.showToast('Déconnecté', 'success');
}

// --- Nouvelle Vente Modal Handling ---
// --- Multi-Item Sales Logic ---
async function openSalesModal(preselectedClientId = null) {
  const clientSelect = document.getElementById('sale-client-id');
  clientSelect.innerHTML = '<option value="">-- Sélectionner Client --</option>';

  const clients = await DB.getClients();
  window.saleFormArticles = await DB.getArticles();

  const role = Auth.getUserRole();
  const user = Auth.getUserProfile();
  let filteredClients = clients;
  if (role === 'employee' && user) {
    filteredClients = clients.filter(c => c.created_by === user.id);
  }

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

  // Add default first row
  addSaleItemRow();

  // Show Modal
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('sales-modal').style.display = 'block';
}

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
    if (priceInput) priceInput.value = '';
    calculateSaleTotals();
    return;
  }

  if (window.saleFormArticles) {
    const art = window.saleFormArticles.find(a => a.id === articleId);
    if (art && priceInput) {
      priceInput.value = art.selling_price;
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
      
      const clients = await DB.getClients();
      const client = clients.find(c => c.dealer_number === decodedText || c.id === decodedText);
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

    container.innerHTML = `
      <label class="label" style="font-size:0.8rem;">${a.name} (Stock: ${a.stock_quantity})</label>
      <input type="number" name="article-qty" data-article-id="${a.id}" class="btn-outline article-qty-input" style="width:100%; padding:8px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary);" min="0" value="0">
    `;
    grid.appendChild(container);
  });

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
  const notes = document.getElementById('stock-invoice-notes').value.trim();

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
      items.push({
        article_id: articleId,
        quantity: quantity
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
  try {
    if (loader) loader.style.display = 'flex';
    await DB.addStockInvoice(invoiceNumber, items, targetEmployeeId, notes, discountPercentage);
    UI.showToast('msg_save_success', 'success');
    closeActiveModal();
    UI.refreshStock();
  } catch (err) {
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
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
  try {
    if (loader) loader.style.display = 'flex';
    await DB.addStockTransfer(sourceId, destId, articleId, qty, notes);
    UI.showToast("Transfert effectué avec succès !", "success");
    closeActiveModal();
    UI.refreshStock();
  } catch (err) {
    UI.showToast(err.message || "Erreur de transfert", "error");
  } finally {
    if (loader) loader.style.display = 'none';
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
  try {
    if (loader) loader.style.display = 'flex';
    await DB.updateStockInvoiceMetadata(oldInvoiceNumber, newInvoiceNumber, discountPercentage, notes);
    UI.showToast('msg_save_success', 'success');
    closeActiveModal();
    UI.refreshStock();
  } catch (err) {
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
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
      const basePrice = art.category === 'recharge' ? (Number(art.face_value) || 0) : (Number(art.buying_price) || 0);
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
          ? `<button type="button" class="btn btn-outline btn-sm text-success" onclick="viewPaymentPhoto('${p.id}')" style="padding:4px 8px; font-size:0.75rem;">Reçu</button>`
          : '-';
        tr.innerHTML = `
          <td>${new Date(p.created_at).toLocaleDateString()}</td>
          <td style="font-weight:600;">${Number(p.amount).toFixed(2)} DH</td>
          <td><span style="font-size:0.8rem;">${p.team_members?.full_name || 'Opérateur'}</span></td>
          <td class="text-right">${photoBtnHtml}</td>
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
      const basePrice = art.category === 'recharge' ? (Number(art.face_value) || 0) : (Number(art.buying_price) || 0);
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

  const user = Auth.getUserProfile();
  const paymentRecord = {
    invoice_number: invoiceNumber,
    amount: amount,
    receipt_photo: paymentPhotoBase64,
    employee_id: user.id
  };

  const loader = document.getElementById('loading-overlay');
  try {
    if (loader) loader.style.display = 'flex';
    await DB.addSupplierPayment(paymentRecord);
    UI.showToast('msg_save_success', 'success');
    closeActiveModal();
    UI.refreshStock();
  } catch (err) {
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
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
  const query = document.getElementById('sales-search').value.toLowerCase();
  const payFilter = document.getElementById('sales-filter-payment').value;
  const catFilter = document.getElementById('sales-filter-category').value;
  
  const trs = document.getElementById('sales-table-body').querySelectorAll('tr');

  trs.forEach(tr => {
    const text = tr.textContent.toLowerCase();
    const matchesQuery = text.includes(query);
    
    // Check payment matching
    let matchesPayment = true;
    if (payFilter !== 'all') {
      const payBadge = tr.querySelector('.badge').textContent.toLowerCase();
      matchesPayment = payBadge === UI.getTranslation('opt_' + payFilter).toLowerCase();
    }

    // Check category matching
    // For simplicity, checking text query matching category keyword
    let matchesCategory = true;
    
    tr.style.display = (matchesQuery && matchesPayment && matchesCategory) ? '' : 'none';
  });
}

// Close active modal helper
function closeActiveModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('sales-modal').style.display = 'none';
  document.getElementById('client-modal').style.display = 'none';
  document.getElementById('team-modal').style.display = 'none';
  document.getElementById('stock-modal').style.display = 'none';
  document.getElementById('receipt-modal').style.display = 'none';
  
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
window.switchLanguage = (lang) => UI.switchLanguage(lang);
window.toggleTheme = () => UI.toggleTheme();
window.showReceipt = showReceipt;
window.printReceiptTicket = printReceiptTicket;
window.generateReport = generateReport;
window.exportReportPDF = exportReportPDF;
window.exportReportCSV = exportReportCSV;
window.exportSalesCSV = exportSalesCSV;
window.saveSettings = saveSettings;
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

window.handleClientImport = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
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
  if (loader) loader.style.display = 'flex';
  
  try {
    await DB.addClients(window.tempImportedClients);
    UI.showToast("Importation réussie avec succès !", "success");
    closeActiveModal();
    UI.refreshClients();
  } catch (err) {
    console.error(err);
    UI.showToast(err.message || "Erreur d'importation", "error");
  } finally {
    if (loader) loader.style.display = 'none';
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

  const newPayment = {
    amount: amount,
    method: method,
    created_at: new Date().toISOString(),
    receipt_photo: method === 'virement' ? creditPaymentPhotoBase64 : null
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

  const loader = document.getElementById('loading-overlay');
  try {
    if (loader) loader.style.display = 'flex';
    
    await DB.updateSale(saleId, {
      payment_status: newStatus,
      notes: newNotes
    });

    UI.showToast('msg_save_success', 'success');
    closeActiveModal();
    navigateTo('credits');
  } catch (err) {
    UI.showToast(err.message || 'Erreur', 'error');
  } finally {
    if (loader) loader.style.display = 'none';
  }
}