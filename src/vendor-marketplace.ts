import { supabase } from './supabase';

export const initVendorMarketplace = async () => {
    console.log("Initializing Vendor Marketplace with Live Data");
    
    // Find the container where vendors are listed in the HTML
    // Based on the Stitch design, there is a grid or list of vendors.
    // We'll target a likely container or just append to body if we can't find it to demonstrate.
    // Let's assume there's a div containing the text "Kano Fabrics Hub" from our seed data or similar
    // Actually, we'll just clear the existing static list and inject our own.
    
    // The Stitch HTML has generic vendor cards. We will find them by looking for repeated elements.
    // We'll replace the main content block.
    
    try {
        const { data: pricesData, error } = await supabase
            .from('prices')
            .select(`
              id, city, min_price, max_price, effective_date,
              category:categories(name, is_per_head),
              wholesaler:wholesalers(name, is_verified)
            `)
            .eq('is_active', true);

        if (error) throw error;
        
        console.log("Fetched Live Vendors:", pricesData);

        // Simple DOM manipulation to inject these vendors
        const container = document.createElement('div');
        container.style.padding = '2rem';
        container.style.marginTop = '2rem';
        container.style.backgroundColor = '#fff4f2'; // Match design system surface
        
        const title = document.createElement('h2');
        title.innerText = "Live Verified Wholesalers (From Supabase)";
        title.style.color = '#705900'; // Primary color
        title.style.marginBottom = '1rem';
        container.appendChild(title);
        
        const list = document.createElement('div');
        list.style.display = 'grid';
        list.style.gap = '1rem';
        
        pricesData.forEach((p: any) => {
            const card = document.createElement('div');
            card.style.padding = '1.5rem';
            card.style.backgroundColor = '#ffffff';
            card.style.borderRadius = '8px';
            card.style.boxShadow = '0 12px 40px rgba(60, 42, 38, 0.06)';
            
            const formatter = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });
            
            card.innerHTML = `
                <h3 style="color: #3c2a26; margin: 0 0 0.5rem 0;">${p.wholesaler.name} ${p.wholesaler.is_verified ? '✅' : ''}</h3>
                <p style="color: #40589c; margin: 0 0 0.5rem 0;"><strong>Category:</strong> ${p.category.name}</p>
                <p style="color: #6c5751; margin: 0;"><strong>City:</strong> ${p.city}</p>
                <p style="color: #126a10; font-weight: bold; margin: 0.5rem 0 0 0;">${formatter.format(p.min_price)} - ${formatter.format(p.max_price)} ${p.category.is_per_head ? 'per head' : ''}</p>
            `;
            list.appendChild(card);
        });
        
        container.appendChild(list);
        
        // Append to the body or a specific main container
        document.body.appendChild(container);

    } catch (err) {
        console.error("Error fetching vendors", err);
    }
};
