import { supabase } from './supabase';

console.log("App Initialized");

// Global state/session checks can go here
const initApp = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        console.log("User is logged in", session.user.email);
        // Optionally update UI elements to show user email
    }
    
    // Page specific logic
    const path = window.location.pathname;
    
    if (path.includes('vendor-marketplace.html')) {
        import('./vendor-marketplace').then(module => {
            module.initVendorMarketplace();
        });
    }
};

document.addEventListener('DOMContentLoaded', initApp);
