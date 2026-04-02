import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Calculator, Save, User, MapPin, Users, Calendar, AlertCircle, ArrowRight, Store } from 'lucide-react';
import { supabase } from './supabase';

type Category = {
  id: string;
  name: string;
  is_per_head: boolean;
};

type Price = {
  id: string;
  city: string;
  min_price: number;
  max_price: number;
  effective_date: string;
  category: Category;
  wholesaler: {
    id: string;
    name: string;
  }
};

type BudgetBreakdownItem = {
  categoryName: string;
  isPerHead: boolean;
  minEstimated: number;
  maxEstimated: number;
  minPricePerUnit: number;
  maxPricePerUnit: number;
  effectiveDate: string;
};

const CalculatorPage = () => {
  const navigate = useNavigate();
  const [totalBudget, setTotalBudget] = useState(1000000);
  const [date, setDate] = useState('');
  const [guestCount, setGuestCount] = useState(200);
  const [city, setCity] = useState('Sokoto');
  const [cities] = useState(['Sokoto', 'Kano', 'Kaduna']);

  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<BudgetBreakdownItem[] | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [calculatingAdvice, setCalculatingAdvice] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const calculateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setBreakdown(null);
    setAiAdvice(null);
    setSaveMessage('');

    try {
      const { data: pricesData, error } = await supabase
        .from('prices')
        .select(`
          id, city, min_price, max_price, effective_date,
          category:categories(id, name, is_per_head),
          wholesaler:wholesalers(id, name)
        `)
        .eq('city', city)
        .eq('is_active', true);

      if (error) throw error;

      const categoryMap = new Map<string, Price>();
      (pricesData as unknown as Price[]).forEach((p) => {
        if (!p.category) return;
        const existing = categoryMap.get(p.category.id);
        if (!existing || p.min_price < existing.min_price) {
          categoryMap.set(p.category.id, p);
        }
      });

      const newBreakdown: BudgetBreakdownItem[] = Array.from(categoryMap.values()).map(p => {
        const multiplier = p.category.is_per_head ? guestCount : 1;
        return {
          categoryName: p.category.name,
          isPerHead: p.category.is_per_head,
          minEstimated: p.min_price * multiplier,
          maxEstimated: p.max_price * multiplier,
          minPricePerUnit: p.min_price,
          maxPricePerUnit: p.max_price,
          effectiveDate: p.effective_date
        };
      });

      setBreakdown(newBreakdown);

      setCalculatingAdvice(true);
      const { data: aiData, error: aiError } = await supabase.functions.invoke('budget-advice', {
        body: { total_budget: totalBudget, date, guest_count: guestCount, city, breakdown: newBreakdown }
      });

      if (aiError) {
        console.error('Error invoking edge function:', aiError);
        setAiAdvice("Could not fetch advice at this time.");
      } else {
        setAiAdvice(aiData.advice);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error calculating budget: ' + err.message);
    } finally {
      setLoading(false);
      setCalculatingAdvice(false);
    }
  };

  const saveBudget = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    
    try {
      const { error } = await supabase.from('saved_budgets').insert({
        user_id: session.user.id,
        total_budget: totalBudget,
        wedding_date: date,
        guest_count: guestCount,
        city,
        breakdown_json: breakdown
      });

      if (error) throw error;
      setSaveMessage('Budget saved successfully!');
    } catch (err: any) {
      console.error(err);
      setSaveMessage('Error saving budget: ' + err.message);
    }
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16">
      
      {/* Hero Header */}
      <div className="text-left md:w-3/4">
        <h1 className="font-display text-5xl md:text-6xl text-on-surface leading-tight tracking-tight">
          The Royal Nuptial Standard
        </h1>
        <p className="font-body text-primary text-lg mt-4">
          Plan your celebration with real wholesale prices in {city}.
        </p>
      </div>

      {/* Input Form (Surface Container Lowest - Elevated) */}
      <div className="bg-surface-container-lowest p-8 rounded-xl shadow-ambient">
        <form onSubmit={calculateBudget} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-2">
            <label className="flex items-center text-sm font-body font-medium text-on-surface-variant">
              <Calculator className="w-4 h-4 mr-2" /> Total Budget (₦)
            </label>
            <input type="number" required min="10000" value={totalBudget} onChange={(e) => setTotalBudget(Number(e.target.value))} 
              className="w-full p-4 bg-surface-container-low text-on-surface border-b border-outline-variant focus:outline-none focus:border-primary font-body transition-colors" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-body font-medium text-on-surface-variant">
              <Calendar className="w-4 h-4 mr-2" /> Wedding Date
            </label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} 
              className="w-full p-4 bg-surface-container-low text-on-surface border-b border-outline-variant focus:outline-none focus:border-primary font-body transition-colors" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-body font-medium text-on-surface-variant">
              <Users className="w-4 h-4 mr-2" /> Guest Count
            </label>
            <input type="number" required min="10" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} 
              className="w-full p-4 bg-surface-container-low text-on-surface border-b border-outline-variant focus:outline-none focus:border-primary font-body transition-colors" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-body font-medium text-on-surface-variant">
              <MapPin className="w-4 h-4 mr-2" /> Location
            </label>
            <select value={city} onChange={(e) => setCity(e.target.value)}
              className="w-full p-4 bg-surface-container-low text-on-surface border-b border-outline-variant focus:outline-none focus:border-primary font-body transition-colors">
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 pt-6">
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-body font-medium py-4 px-6 rounded-md shadow-ambient transition hover:scale-[1.01] flex justify-center items-center">
              {loading ? 'Calculating with Live Data...' : 'Calculate Breakdown'}
            </button>
          </div>
        </form>
      </div>

      {breakdown && (
        <div className="space-y-16">
          
          {/* Breakdown Section */}
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
             <div className="bg-surface-container-low p-8 flex justify-between items-center">
               <h2 className="font-display text-3xl text-on-surface">Cost Estimate</h2>
               <button onClick={saveBudget} className="flex items-center text-primary font-body font-medium hover:opacity-80 transition">
                  <Save className="w-4 h-4 mr-2" /> Save & Return
               </button>
             </div>
             {saveMessage && <div className="p-4 bg-primary-container text-on-surface text-sm text-center font-body">{saveMessage}</div>}
             
             <div className="flex flex-col gap-6 p-8 bg-surface">
                {breakdown.length === 0 && (
                  <p className="text-center font-body text-on-surface-variant">No pricing data available for this city yet.</p>
                )}
                {breakdown.map((item, i) => {
                  const percentMin = ((item.minEstimated / totalBudget) * 100).toFixed(1);
                  const isOver = item.minEstimated > totalBudget;
                  // Alternating background for items as per "No-Line" rule
                  const bgClass = i % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container';
                  
                  return (
                    <div key={i} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl ${bgClass}`}>
                      <div>
                        <h3 className="font-display text-xl text-on-surface">{item.categoryName}</h3>
                        <p className="font-body text-sm text-on-surface-variant mt-2 flex items-center">
                           <Store className="w-4 h-4 mr-2"/>
                           {formatNaira(item.minPricePerUnit)} - {formatNaira(item.maxPricePerUnit)} {item.isPerHead ? 'per head' : ''}
                           <span className="ml-3 text-xs bg-surface-container-lowest px-3 py-1 rounded-full text-on-surface">As of {new Date(item.effectiveDate).toLocaleDateString()}</span>
                        </p>
                      </div>
                      <div className="text-right">
                         <div className={`font-display text-2xl ${isOver ? 'text-red-700' : 'text-on-surface'}`}>
                           {formatNaira(item.minEstimated)} - {formatNaira(item.maxEstimated)}
                         </div>
                         <div className="font-body text-sm text-primary mt-1">
                            {percentMin}% of total budget
                         </div>
                      </div>
                    </div>
                  )
                })}
             </div>

             {/* Vendor CTA */}
             <div className="p-8 bg-surface-container-highest flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h4 className="font-display text-2xl text-on-surface">Ready to start booking?</h4>
                  <p className="font-body text-on-surface-variant mt-2">Connect directly with verified wholesalers in {city}.</p>
                </div>
                <button className="mt-6 md:mt-0 bg-primary text-on-primary font-body px-8 py-3 rounded-md font-medium flex items-center transition hover:opacity-90 shadow-ambient">
                  Get Quotes <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
          </div>

          {/* AI Advice Panel */}
          <div className="bg-surface-container rounded-xl p-8 relative overflow-hidden">
            <h2 className="font-display text-3xl text-secondary flex items-center mb-6">
               <AlertCircle className="w-6 h-6 mr-3" /> Expert Advice
            </h2>
            <div className="font-body text-on-surface text-lg bg-surface-container-lowest p-6 rounded-xl shadow-ambient whitespace-pre-wrap leading-relaxed">
               {calculatingAdvice ? (
                 <div className="animate-pulse space-y-4">
                   <div className="h-4 bg-outline-variant/30 rounded w-3/4"></div>
                   <div className="h-4 bg-outline-variant/30 rounded w-1/2"></div>
                 </div>
               ) : (
                 aiAdvice || "Submit your details to get personalized budget advice based on local trends."
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        const { error: signUpErr } = await supabase.auth.signUp({ email, password });
        if (signUpErr) throw signUpErr;
        alert('Check your email to confirm your account!');
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-surface-container-lowest p-10 rounded-xl shadow-ambient mt-16">
      <h2 className="font-display text-4xl text-center text-on-surface mb-8">{isSignUp ? 'Join Us' : 'Welcome Back'}</h2>
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 font-body text-sm">{error}</div>}
      <form onSubmit={handleAuth} className="space-y-6">
        <div>
          <label className="block font-body text-sm font-medium text-on-surface-variant mb-2">Email Address</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
            className="w-full p-4 bg-surface-container-low text-on-surface border-b border-outline-variant focus:outline-none focus:border-primary font-body transition-colors" />
        </div>
        <div>
          <label className="block font-body text-sm font-medium text-on-surface-variant mb-2">Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
            className="w-full p-4 bg-surface-container-low text-on-surface border-b border-outline-variant focus:outline-none focus:border-primary font-body transition-colors" />
        </div>
        <button type="submit" className="w-full bg-primary text-on-primary font-body font-medium py-4 rounded-md shadow-ambient transition hover:opacity-90">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      <div className="mt-8 text-center">
        <button onClick={() => setIsSignUp(!isSignUp)} className="font-body text-primary hover:text-on-surface transition text-sm font-medium">
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
};

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      {/* Background set to surface */}
      <div className="min-h-screen bg-surface font-body text-on-surface selection:bg-primary-container selection:text-on-surface pb-24">
        
        {/* Glassmorphism Navigation */}
        <nav className="bg-surface/70 backdrop-blur-md py-6 px-8 md:px-16 flex justify-between items-center sticky top-0 z-50 transition-all">
          <Link to="/" className="font-display text-3xl font-bold text-primary flex items-center">
            Biki Na
          </Link>
          <div>
            {session ? (
              <div className="flex items-center space-x-6">
                <span className="font-body text-sm text-on-surface-variant hidden md:inline">{session.user.email}</span>
                <button onClick={() => supabase.auth.signOut()} className="font-body text-sm font-medium text-on-surface-variant hover:text-red-700 transition">Sign Out</button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center font-body text-sm font-medium text-primary hover:text-on-surface transition bg-surface-container-highest px-5 py-2.5 rounded-md">
                <User className="w-4 h-4 mr-2" /> Sign In
              </Link>
            )}
          </div>
        </nav>
        
        {/* Main Content Area */}
        <main className="px-6 md:px-16 pt-12">
          <Routes>
            <Route path="/" element={<CalculatorPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
