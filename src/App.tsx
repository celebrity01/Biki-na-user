import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Calculator, Save, User, MapPin, Users, Calendar, AlertCircle, ArrowRight, Store } from 'lucide-react';
import { supabase } from './supabase';

// Types
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
      // Fetch prices for the selected city
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

      // Group by category, finding the lowest min_price
      const categoryMap = new Map<string, Price>();
      (pricesData as unknown as Price[]).forEach((p) => {
        if (!p.category) return; // safety
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

      // Fetch AI advice
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-teal-800">Northern Wedding Budget Calculator</h1>
        <p className="mt-2 text-gray-600">Plan your special day with real wholesale prices in {city}</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={calculateBudget} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Calculator className="w-4 h-4 mr-2" /> Total Budget (₦)
            </label>
            <input type="number" required min="10000" value={totalBudget} onChange={(e) => setTotalBudget(Number(e.target.value))} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 mr-2" /> Wedding Date
            </label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Users className="w-4 h-4 mr-2" /> Guest Count
            </label>
            <input type="number" required min="10" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4 mr-2" /> Location
            </label>
            <select value={city} onChange={(e) => setCity(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500">
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 pt-4">
            <button type="submit" disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex justify-center items-center">
              {loading ? 'Calculating with Live Data...' : 'Calculate Breakdown'}
            </button>
          </div>
        </form>
      </div>

      {breakdown && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
               <h2 className="text-xl font-bold text-gray-800">Cost Breakdown Estimate</h2>
               <button onClick={saveBudget} className="flex items-center text-teal-600 hover:text-teal-800 font-medium">
                  <Save className="w-4 h-4 mr-1" /> Save & Return
               </button>
             </div>
             {saveMessage && <div className="p-4 bg-green-50 text-green-700 text-sm text-center font-medium">{saveMessage}</div>}
             
             <div className="divide-y divide-gray-100">
                {breakdown.length === 0 && (
                  <p className="p-6 text-center text-gray-500">No pricing data available for this city yet.</p>
                )}
                {breakdown.map((item, i) => {
                  const percentMin = ((item.minEstimated / totalBudget) * 100).toFixed(1);
                  const isOver = item.minEstimated > totalBudget;
                  return (
                    <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50">
                      <div>
                        <h3 className="font-bold text-gray-800">{item.categoryName}</h3>
                        <p className="text-sm text-gray-500 mt-1 flex items-center">
                           <Store className="w-3 h-3 mr-1"/>
                           {formatNaira(item.minPricePerUnit)} - {formatNaira(item.maxPricePerUnit)} {item.isPerHead ? 'per head' : ''}
                           <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">As of {new Date(item.effectiveDate).toLocaleDateString()}</span>
                        </p>
                      </div>
                      <div className="text-right">
                         <div className={`text-lg font-bold ${isOver ? 'text-red-600' : 'text-gray-800'}`}>
                           {formatNaira(item.minEstimated)} - {formatNaira(item.maxEstimated)}
                         </div>
                         <div className="text-sm text-gray-500 mt-1">
                            {percentMin}% of total budget
                         </div>
                      </div>
                    </div>
                  )
                })}
             </div>

             {/* Vendor CTA */}
             <div className="p-6 bg-teal-50 border-t border-teal-100 flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h4 className="font-bold text-teal-900">Ready to start booking?</h4>
                  <p className="text-teal-700 text-sm mt-1">Connect directly with verified wholesalers in {city} to lock in these prices.</p>
                </div>
                <button className="mt-4 md:mt-0 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium flex items-center">
                  Get Quotes <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
          </div>

          {/* AI Advice Panel */}
          <div className="bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100 p-6">
            <h2 className="text-xl font-bold text-indigo-900 flex items-center mb-4">
               <AlertCircle className="w-5 h-5 mr-2 text-indigo-600" /> AI Budget Advice
            </h2>
            <div className="text-indigo-800 bg-white p-4 rounded-xl border border-indigo-50 shadow-sm whitespace-pre-wrap">
               {calculatingAdvice ? (
                 <div className="animate-pulse flex space-x-4">
                   <div className="flex-1 space-y-4 py-1">
                     <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
                     <div className="h-4 bg-indigo-200 rounded w-1/2"></div>
                   </div>
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
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-12">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" />
        </div>
        <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition duration-200">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <button onClick={() => setIsSignUp(!isSignUp)} className="text-teal-600 hover:text-teal-800 text-sm font-medium">
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
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <nav className="bg-white border-b border-gray-200 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <Link to="/" className="text-2xl font-bold text-teal-600 flex items-center">
            💍 Biki Na
          </Link>
          <div>
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 hidden md:inline">{session.user.email}</span>
                <button onClick={() => supabase.auth.signOut()} className="text-sm font-medium text-gray-600 hover:text-red-600">Sign Out</button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center text-sm font-medium text-teal-600 hover:text-teal-800 bg-teal-50 px-4 py-2 rounded-lg">
                <User className="w-4 h-4 mr-2" /> Sign In
              </Link>
            )}
          </div>
        </nav>
        
        <main className="p-6 md:p-12">
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
