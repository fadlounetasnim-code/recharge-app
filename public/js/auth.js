// Authentication & Role Management Service
const Auth = (() => {
  let currentUser = null;
  let userProfile = null;

  // Pre-configured Demo Accounts
  const demoAccounts = {
    'admin@recharge.com': { id: 'admin-id', full_name: 'Super Admin', email: 'admin@recharge.com', role: 'admin', is_active: true, phone: '0600000000', assigned_sector: 'National', dealer_code: 'D-ADMIN' },
    'supervisor@recharge.com': { id: 'sup-id', full_name: 'Supervisor Test', email: 'supervisor@recharge.com', role: 'supervisor', is_active: true, phone: '0611111111', assigned_sector: 'Casa-Anfa', dealer_code: 'D-SUP01' },
    'employee@recharge.com': { id: 'emp-id', full_name: 'Employee Test', email: 'employee@recharge.com', role: 'employee', is_active: true, phone: '0622222222', assigned_sector: 'Maarif', dealer_code: 'D-EMP01' }
  };

  // Perform Login
  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    
    // 1. Try Supabase first if active
    if (DB.getUseSupabase()) {
      try {
        const client = DB.getSupabaseClient();
        const { data, error } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (error) throw error;
        
        // Fetch custom user profile from team_members
        const { data: profile, error: profError } = await client
          .from('team_members')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profError || !profile) {
          throw new Error('Votre profil est introuvable.');
        }

        if (!profile.is_active) {
          throw new Error('Votre compte est inactif. Contactez l\'administrateur.');
        }

        currentUser = data.user;
        userProfile = profile;
        saveSessionToStorage();
        return userProfile;
      } catch (e) {
        // If Supabase login fails, check if this is a demo account with the default password for local fallback
        if (demoAccounts[cleanEmail] && password === '123456') {
          console.log('Auth: Supabase credentials failed/rejected. Falling back to local demo bypass.');
          DB.setUseSupabase(false);
          const profile = demoAccounts[cleanEmail];
          if (!profile.is_active) {
            throw new Error('Compte inactif.');
          }
          currentUser = { id: profile.id, email: profile.email };
          userProfile = profile;
          saveSessionToStorage();
          return userProfile;
        }
        console.error('Supabase Login failed:', e);
        throw e;
      }
    }

    // 2. Demo Mode bypass - if using demo accounts and demo password
    if (demoAccounts[cleanEmail] && password === '123456') {
      console.log('Auth: Demo credentials detected. Switching to local database mode.');
      const profile = demoAccounts[cleanEmail];
      if (!profile.is_active) {
        throw new Error('Compte inactif.');
      }
      currentUser = { id: profile.id, email: profile.email };
      userProfile = profile;
      saveSessionToStorage();
      return userProfile;
    }

    // Otherwise, check if user exists in the local database storage
    const localTeam = JSON.parse(localStorage.getItem('team_members')) || [];
    const localUser = localTeam.find(t => t.email.toLowerCase() === cleanEmail);
    if (localUser) {
      const expectedPassword = localUser.password || '123456';
      if (password === expectedPassword) {
        if (!localUser.is_active) {
          throw new Error('Compte inactif.');
        }
        currentUser = { id: localUser.id, email: localUser.email };
        userProfile = localUser;
        saveSessionToStorage();
        return userProfile;
      }
    }

    throw new Error('Identifiants invalides (Le mot de passe démo est 123456)');
  };

  // Perform Logout
  const logout = async () => {
    // Reset Supabase connection state if credentials exist
    const storedUrl = localStorage.getItem('supabase_url') || 'https://rzubtzpqdxanygzkquko.supabase.co';
    const storedKey = localStorage.getItem('supabase_key') || 'sb_publishable_GY2IDrcWN7G1cCaE_dThYg_RMwARiqp';
    if (storedUrl && storedKey) {
      DB.init(storedUrl, storedKey);
    }

    if (DB.getUseSupabase()) {
      try {
        await DB.getSupabaseClient().auth.signOut();
      } catch (e) {
        console.error('Supabase SignOut error:', e);
      }
    }
    currentUser = null;
    userProfile = null;
    sessionStorage.removeItem('recharge_session');
    localStorage.removeItem('recharge_session');
    console.log('Auth: Logged out successfully.');
  };

  // Cache helper
  const saveSessionToStorage = () => {
    const sessionData = {
      user: currentUser,
      profile: userProfile,
      isDemo: !DB.getUseSupabase()
    };
    sessionStorage.setItem('recharge_session', JSON.stringify(sessionData));
    localStorage.setItem('recharge_session', JSON.stringify(sessionData)); // Persistence across reloads
  };

  // Load Session on start
  const checkSession = () => {
    const sessionStr = sessionStorage.getItem('recharge_session') || localStorage.getItem('recharge_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        currentUser = session.user;
        userProfile = session.profile;
        console.log('Auth: Loaded active session for', userProfile.full_name);
        
        // Disable Supabase only if this session was explicitly started as a local demo session
        if (session.isDemo) {
          console.log('Auth: Active session is a local demo session. Disabling Supabase client.');
          DB.setUseSupabase(false);
        }
        
        return true;
      } catch (e) {
        console.error('Auth: Session corruption:', e);
        logout();
      }
    }
    return false;
  };

  const updateProfile = (newProfile) => {
    if (userProfile) {
      userProfile = { ...userProfile, ...newProfile };
      saveSessionToStorage();
    }
  };

  return {
    login,
    logout,
    checkSession,
    updateProfile,
    isLoggedIn: () => !!userProfile,
    getCurrentUser: () => currentUser,
    getUserProfile: () => userProfile,
    getUserRole: () => userProfile ? userProfile.role : null,
    isAdmin: () => userProfile && userProfile.role === 'admin',
    isSupervisor: () => userProfile && userProfile.role === 'supervisor',
    isEmployee: () => userProfile && userProfile.role === 'employee'
  };
})();