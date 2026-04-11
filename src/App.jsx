import { useState, useCallback, createContext, useContext, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from "recharts";
import { supabase } from './supabase.js';

const Ctx = createContext({});
const useCtx = () => useContext(Ctx);

function useLS(key, def) {
  const [v, sv] = useState(() => { try{const s=localStorage.getItem(key);return s?JSON.parse(s):def;}catch{return def;} });
  const set = useCallback((nv) => {
    if (typeof nv === 'function') { sv(prev=>{const nx=nv(prev);try{localStorage.setItem(key,JSON.stringify(nx));}catch{}return nx;}); }
    else { sv(nv); try{localStorage.setItem(key,JSON.stringify(nv));}catch{} }
  }, [key]);
  return [v, set];
}

const DK={bg:'#000000',s:'#0a0a0a',s2:'#050505',bd:'#1a1a1a',bd2:'#111',t:'#ffffff',t2:'#999',t3:'#444',t4:'#1f1f1f',acc:'#ffffff',accBg:'#111111',accMid:'#cccccc',inc:'#00FF88',incBg:'#001a0f',exp:'#FF3D3D',expBg:'#1a0000'};
const LT={bg:'#ffffff',s:'#f5f5f5',s2:'#efefef',bd:'#e0e0e0',bd2:'#e8e8e8',t:'#000000',t2:'#555',t3:'#999',t4:'#ddd',acc:'#111111',accBg:'#f0f0f0',accMid:'#333333',inc:'#00994d',incBg:'#d6ffed',exp:'#e02020',expBg:'#ffe0e0'};

const CATS=[
  {name:'Housing',      icon:'🏠',c:'#FF4757'},
  {name:'Bills',        icon:'📄',c:'#FFA502'},
  {name:'Food',         icon:'🍽️',c:'#FF6348'},
  {name:'Transport',    icon:'🚗',c:'#2ED573'},
  {name:'Subscriptions',icon:'📱',c:'#A855F7'},
  {name:'Debt',         icon:'💳',c:'#FF6B9D'},
  {name:'Health',       icon:'💊',c:'#00D2D3'},
  {name:'Shopping',     icon:'🛍️',c:'#ECCC68'},
  {name:'Personal',     icon:'👤',c:'#26D07C'},
  {name:'Entertainment',icon:'🎭',c:'#1E90FF'},
  {name:'Savings',      icon:'💰',c:'#A5D6A7'},
  {name:'Other',        icon:'📦',c:'#747D8C'},
];
const ICATS=['Salary','Freelance','Investment','Gift','Other'];
const EVT={
  payday:{label:'Payday',color:'#00FF88',bg:'#001a0f'},
  bill:{label:'Bill',color:'#FF3D3D',bg:'#1a0000'},
  subscription:{label:'Subscription',color:'#0066FF',bg:'#00112e'},
  savings:{label:'Transfer',color:'#66aaff',bg:'#00082a'},
  other:{label:'Other',color:'#888',bg:'#111'},
};
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const CURRENCIES = [
  { code:'GBP', flag:'🇬🇧', name:'British Pound',      locale:'en-GB' },
  { code:'AUD', flag:'🇦🇺', name:'Australian Dollar',   locale:'en-AU' },
  { code:'USD', flag:'🇺🇸', name:'US Dollar',           locale:'en-US' },
  { code:'EUR', flag:'🇪🇺', name:'Euro',                locale:'de-DE' },
  { code:'CAD', flag:'🇨🇦', name:'Canadian Dollar',     locale:'en-CA' },
  { code:'NZD', flag:'🇳🇿', name:'New Zealand Dollar',  locale:'en-NZ' },
  { code:'JPY', flag:'🇯🇵', name:'Japanese Yen',        locale:'ja-JP' },
  { code:'CHF', flag:'🇨🇭', name:'Swiss Franc',         locale:'de-CH' },
  { code:'ZAR', flag:'🇿🇦', name:'South African Rand',  locale:'en-ZA' },
  { code:'INR', flag:'🇮🇳', name:'Indian Rupee',        locale:'en-IN' },
  { code:'AED', flag:'🇦🇪', name:'UAE Dirham',          locale:'ar-AE' },
  { code:'SGD', flag:'🇸🇬', name:'Singapore Dollar',    locale:'en-SG' },
  { code:'HKD', flag:'🇭🇰', name:'Hong Kong Dollar',    locale:'zh-HK' },
  { code:'SEK', flag:'🇸🇪', name:'Swedish Krona',       locale:'sv-SE' },
  { code:'NOK', flag:'🇳🇴', name:'Norwegian Krone',     locale:'nb-NO' },
  { code:'DKK', flag:'🇩🇰', name:'Danish Krone',        locale:'da-DK' },
  { code:'MXN', flag:'🇲🇽', name:'Mexican Peso',        locale:'es-MX' },
  { code:'BRL', flag:'🇧🇷', name:'Brazilian Real',      locale:'pt-BR' },
  { code:'PLN', flag:'🇵🇱', name:'Polish Zloty',        locale:'pl-PL' },
  { code:'THB', flag:'🇹🇭', name:'Thai Baht',           locale:'th-TH' },
  { code:'MYR', flag:'🇲🇾', name:'Malaysian Ringgit',   locale:'ms-MY' },
  { code:'PHP', flag:'🇵🇭', name:'Philippine Peso',     locale:'en-PH' },
  { code:'IDR', flag:'🇮🇩', name:'Indonesian Rupiah',   locale:'id-ID' },
  { code:'KRW', flag:'🇰🇷', name:'South Korean Won',    locale:'ko-KR' },
  { code:'TRY', flag:'🇹🇷', name:'Turkish Lira',        locale:'tr-TR' },
];

const fmtCurrency=(n,code,locale)=>new Intl.NumberFormat(locale||'en-GB',{style:'currency',currency:code||'GBP',maximumFractionDigits:['JPY','KRW','IDR'].includes(code)?0:2}).format(n);
const fmtGBP=n=>fmtCurrency(n,'GBP','en-GB');
const DEMO_ACCS=[{id:1,bank:'Monzo',type:'Current Account',balance:2847.5,iban:'GB29 MONZ 0000 0012 3456 78',color:'#f97316'},{id:2,bank:'Barclays',type:'Savings Account',balance:8120,iban:'GB94 BARC 2014 7032 1480 01',color:'#2563eb'}];
const DEMO_BTX=[{id:101,date:'2025-04-05',merchant:'Tesco',amount:-42.8,category:'Food',bank:'Monzo'},{id:102,date:'2025-04-04',merchant:'Salary — April',amount:2450,category:'Salary',bank:'Monzo'},{id:103,date:'2025-04-03',merchant:'Netflix',amount:-17.99,category:'Entertainment',bank:'Barclays'},{id:104,date:'2025-04-02',merchant:'TfL',amount:-12.4,category:'Transport',bank:'Monzo'},{id:105,date:'2025-04-01',merchant:'Rent',amount:-950,category:'Housing',bank:'Barclays'}];

function mkCSS(th){return`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${th.bg}}::-webkit-scrollbar-thumb{background:${th.acc}88;border-radius:2px}
::-webkit-scrollbar-thumb:hover{background:${th.acc}}

/* Nav buttons */
.nb{background:none;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:11px 14px;border-radius:9px;transition:all .18s;text-align:left;display:flex;align-items:center;gap:10px;width:100%;color:${th.t3}}
.nb:hover{color:${th.t};background:${th.s};transform:translateX(2px)}
.nb.on{background:rgba(255,255,255,0.07);color:#fff;box-shadow:0 0 0 1px rgba(255,255,255,0.1),inset 0 0 20px rgba(255,255,255,0.03)}

/* Buttons */
.btn{background:#ffffff;border:none;color:#000;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:11px 22px;border-radius:9px;cursor:pointer;transition:all .18s;white-space:nowrap;box-shadow:0 0 20px rgba(255,255,255,0.18),0 0 40px rgba(255,255,255,0.06)}
.btn:hover{transform:translateY(-1px);box-shadow:0 0 28px rgba(255,255,255,0.28),0 0 50px rgba(255,255,255,0.1);opacity:.95}
.btn:active{transform:translateY(0)}
.bout{background:transparent;border:1px solid ${th.bd};color:${th.t3};font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:10px 20px;border-radius:9px;cursor:pointer;transition:all .18s}
.bout:hover{border-color:rgba(255,255,255,0.3);color:${th.t};background:rgba(255,255,255,0.04)}

/* Cards */
.card{background:linear-gradient(145deg,${th.s},${th.s2});border:1px solid ${th.bd};border-radius:16px;padding:26px;position:relative;overflow:hidden;box-shadow:0 2px 12px #00000022,0 0 0 1px rgba(255,255,255,0.03);transition:box-shadow .2s}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)}
.card:hover{box-shadow:0 4px 24px #00000033,0 0 0 1px rgba(255,255,255,0.05)}
.cardsm{background:linear-gradient(145deg,${th.s},${th.s2});border:1px solid ${th.bd};border-radius:12px;padding:16px 20px;box-shadow:0 2px 8px #00000018}

/* Inputs */
input,select,textarea{background:${th.s2};border:1px solid ${th.bd2};color:${th.t};font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;padding:12px 15px;border-radius:10px;outline:none;width:100%;transition:all .2s}
input:focus,select:focus,textarea:focus{border-color:${th.acc};box-shadow:0 0 0 3px ${th.acc}22}
select option{background:${th.s}}
label{font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${th.t3};display:block;margin-bottom:7px}

/* Modal */
.overlay{position:fixed;inset:0;background:#000d;backdrop-filter:blur(16px);z-index:200;display:flex;align-items:center;justify-content:center;animation:fi .2s}
.modal{background:linear-gradient(145deg,${th.s},${th.s2});border:1px solid ${th.bd};border-radius:20px;padding:38px;width:480px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px #00000055}
.modal::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${th.acc},transparent);border-radius:20px}
@keyframes fi{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}

/* Tab fade-in */
@keyframes tabIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.tabcontent{animation:tabIn .22s ease}

/* Transactions */
.txr{display:flex;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid ${th.bd2};transition:all .15s}
.txr:last-child{border-bottom:none}
.txr:hover{background:${th.acc}08;margin:0 -8px;padding:13px 8px;border-radius:10px;border-bottom-color:transparent}
.delbtn{background:none;border:none;color:${th.t3};cursor:pointer;font-size:12px;padding:4px 8px;border-radius:6px;transition:all .12s;opacity:0}
.txr:hover .delbtn,.delbtn.vis{opacity:1}.delbtn:hover{background:${th.expBg};color:${th.exp}}

/* Progress bars */
.prog{height:6px;background:${th.bd2};border-radius:3px;overflow:hidden}
.pfill{height:100%;border-radius:3px;transition:width .6s cubic-bezier(.4,0,.2,1)}

/* Chips */
.chip{display:inline-flex;align-items:center;font-family:'Plus Jakarta Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:20px}

/* Calendar */
.evdot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.ccell{min-height:76px;background:${th.s2};border:1px solid ${th.bd2};border-radius:10px;padding:8px;cursor:pointer;transition:all .18s}
.ccell:hover{border-color:${th.acc};background:${th.s};transform:translateY(-1px);box-shadow:0 4px 12px #00000022}
.ccell.tod{border-color:${th.acc}!important;box-shadow:0 0 0 2px ${th.acc}44}

/* Labels & misc */
.sl{font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${th.acc};margin-bottom:16px}
.mono{font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;color:${th.t3};letter-spacing:.04em}
.alertbar{border-radius:10px;padding:12px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif}
.frow{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center}
.bprov{background:linear-gradient(145deg,${th.s},${th.s2});border:1px solid ${th.bd2};border-radius:14px;padding:20px;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:14px;margin-bottom:12px;box-shadow:0 2px 8px #00000018}
.bprov:hover,.bprov.sel{border-color:${th.acc};box-shadow:0 4px 16px ${th.acc}22}

/* Empty state */
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;gap:12px}
.empty-icon{font-size:48px;margin-bottom:4px;opacity:.5}
.empty-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:700;color:${th.t2}}
.empty-sub{font-size:13px;color:${th.t3};max-width:260px;line-height:1.6}

/* Mobile responsive */
@media(max-width:768px){
  .sidebar{position:fixed!important;left:${`var(--sb-open,-230px)`};top:0;z-index:50;height:100vh;transition:left .25s cubic-bezier(.4,0,.2,1)}
  .sidebar.open{left:0!important}
  .mob-backdrop{display:block!important}
  .mob-close{display:block!important}
  .mob-topbar{display:flex!important}
  .main-pad{padding:20px 16px!important}
  .card{padding:18px}
  .g3{grid-template-columns:1fr!important}
  .g2{grid-template-columns:1fr!important}
  .g32{grid-template-columns:1fr!important}
  .fab{bottom:16px!important;right:16px!important;width:50px!important;height:50px!important;font-size:22px!important}
}
`;}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode,setMode]=useState('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');

  const handle=async()=>{
    setLoading(true);setError('');setMessage('');
    if(mode==='login'){
      const {error:e}=await supabase.auth.signInWithPassword({email,password});
      if(e) setError(e.message);
    } else if(mode==='signup'){
      const {error:e}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:'https://itztibby.github.io/finance-tracker'}});
      if(e) setError(e.message);
      else setMessage('Check your email to confirm your account then log in.');
    } else {
      const {error:e}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
      if(e) setError(e.message);
      else setMessage('Password reset email sent — check your inbox.');
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .auth-input{background:#0a0a0a;border:1px solid #222;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;padding:14px 16px;border-radius:10px;outline:none !important;box-shadow:none !important;width:100%;transition:border-color .2s;display:block;}
        .auth-input:focus{border-color:#444;outline:none !important;box-shadow:none !important;}
        .auth-btn{background:#fff;border:none;color:#000;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:14px;border-radius:10px;cursor:pointer;width:100%;transition:all .18s;box-shadow:0 0 20px rgba(255,255,255,0.18),0 0 40px rgba(255,255,255,0.06);}
        .auth-btn:hover{box-shadow:0 0 28px rgba(255,255,255,0.28);opacity:.92;}
        .auth-btn:disabled{opacity:.5;cursor:not-allowed;}
        .auth-link{background:none;border:none;color:#555;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;cursor:pointer;text-decoration:underline;padding:0;}
        .auth-link:hover{color:#888;}
      `}</style>
      <div style={{width:380,padding:'0 20px'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:24,fontWeight:800,color:'#fff',marginBottom:6}}>Finance Tracker</div>
          <div style={{fontSize:12,color:'#333',letterSpacing:'.1em',textTransform:'uppercase'}}>
            {mode==='login'?'Sign in to your account':mode==='signup'?'Create your account':'Reset your password'}
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <input className="auth-input" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()}/>
          {mode!=='reset'&&<input className="auth-input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()}/>}

          {error&&<div style={{fontSize:12,color:'#FF3D3D',padding:'10px 14px',background:'#1a0000',borderRadius:8,border:'1px solid #FF3D3D44'}}>{error}</div>}
          {message&&<div style={{fontSize:12,color:'#00FF88',padding:'10px 14px',background:'#001a0f',borderRadius:8,border:'1px solid #00FF8844'}}>{message}</div>}

          <button className="auth-btn" onClick={handle} disabled={loading} style={{marginTop:4}}>
            {loading?'Please wait...':(mode==='login'?'Sign In':mode==='signup'?'Create Account':'Send Reset Email')}
          </button>
        </div>

        <div style={{textAlign:'center',marginTop:24,display:'flex',flexDirection:'column',gap:10}}>
          {mode==='login'&&<>
            <span style={{fontSize:12,color:'#444'}}>Don't have an account? <button className="auth-link" onClick={()=>{setMode('signup');setError('');setMessage('');}}>Sign up</button></span>
            <span style={{fontSize:12,color:'#444'}}><button className="auth-link" onClick={()=>{setMode('reset');setError('');setMessage('');}}>Forgot password?</button></span>
          </>}
          {mode==='signup'&&<span style={{fontSize:12,color:'#444'}}>Already have an account? <button className="auth-link" onClick={()=>{setMode('login');setError('');setMessage('');}}>Sign in</button></span>}
          {mode==='reset'&&<span style={{fontSize:12,color:'#444'}}><button className="auth-link" onClick={()=>{setMode('login');setError('');setMessage('');}}>Back to sign in</button></span>}
        </div>
      </div>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({pin, onAuth, isDark}) {
  const th = isDark ? DK : LT;
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = (val) => {
    if(val === pin) { onAuth(); }
    else {
      setError(true); setShake(true);
      setTimeout(()=>{ setEntry(''); setError(false); setShake(false); }, 600);
    }
  };

  const press = (d) => {
    if(entry.length >= 6) return;
    const next = entry + d;
    setEntry(next);
    if(next.length === pin.length) setTimeout(()=>submit(next), 120);
  };

  const del = () => setEntry(e => e.slice(0,-1));

  return (
    <div style={{minHeight:'100vh',background:th.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&family=DM+Mono:wght@500&display=swap');
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        .shake{animation:shake .4s ease;}
        .pinbtn{background:${th.s};border:1px solid ${th.bd};color:${th.t};font-family:'Plus Jakarta Sans',sans-serif;font-size:20px;font-weight:700;width:64px;height:64px;border-radius:16px;cursor:pointer;transition:all .1s;display:flex;align-items:center;justify-content:center;}
        .pinbtn:hover{background:${th.bd};border-color:${th.t3};}
        .pinbtn:active{transform:scale(.93);}
      `}</style>
      <div style={{textAlign:'center',width:280}}>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,color:th.t,marginBottom:6}}>Finance Tracker</div>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,color:th.t3,marginBottom:40}}>ENTER YOUR PIN</div>

        {/* Dots */}
        <div className={shake?'shake':''} style={{display:'flex',justifyContent:'center',gap:12,marginBottom:40}}>
          {Array.from({length:pin.length}).map((_,i)=>(
            <div key={i} style={{width:14,height:14,borderRadius:'50%',background:i<entry.length?(error?DK.exp:th.acc):th.bd,border:`2px solid ${i<entry.length?(error?DK.exp:th.acc):th.bd2}`,transition:'all .15s'}}/>
          ))}
        </div>

        {/* Numpad */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:10}}>
          {[1,2,3,4,5,6,7,8,9].map(n=>(
            <button key={n} className="pinbtn" onClick={()=>press(String(n))}>{n}</button>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          <div/>
          <button className="pinbtn" onClick={()=>press('0')}>0</button>
          <button className="pinbtn" onClick={del} style={{fontSize:16}}>⌫</button>
        </div>

        {error&&<div style={{marginTop:20,fontSize:12,color:DK.exp}}>Incorrect PIN</div>}
      </div>
    </div>
  );
}

export default function App() {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const [user,    setUser]       = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const userRef = useRef(null);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user??null);
      userRef.current=session?.user??null;
      setAuthLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user??null);
      userRef.current=session?.user??null;
    });
    return ()=>subscription.unsubscribe();
  },[]);

  // ── Preferences (localStorage) ─────────────────────────────────────────────
  const [isDark,  setIsDark]  = useLS('ft3_dark', true);
  const [curr,    setCurr]    = useLS('ft3_curr',  'GBP');
  const [pin,     setPin]     = useLS('ft3_pin', '');
  const [authed,  setAuthed]  = useState(!localStorage.getItem('ft3_pin'));
  const [confirmDeletes, setConfirmDeletes] = useLS('ft3_confirm', true);
  const [bDemo,   setBDemo]   = useLS('ft3_bdemo', false);

  // ── Data state (Supabase) ──────────────────────────────────────────────────
  const [tx,     setTxRaw]    = useState([]);
  const [budg,   setBudgRaw]  = useState(CATS.map(c=>({category:c.name,limit:500})));
  const [goals,  setGoalsRaw] = useState([]);
  const [cal,    setCalRaw]   = useState([]);
  const [assets, setAssetsRaw]= useState([]);
  const [liabs,  setLiabsRaw] = useState([]);
  const [debts,  setDebtsRaw] = useState([]);
  const [subs,   setSubsRaw]  = useState([]);
  const [efSaved,       setEfSavedRaw]    = useState(0);
  const [efExpenses,    setEfExpensesRaw] = useState(0);
  const [efMonths,      setEfMonthsRaw]   = useState(6);
  const [debtExtra,     setDebtExtraRaw]  = useState(200);
  const [debtMethod,    setDebtMethodRaw] = useState('snowball');

  const txRef    = useRef([]);
  const budgRef  = useRef(CATS.map(c=>({category:c.name,limit:500})));
  const goalsRef = useRef([]);
  const calRef   = useRef([]);
  const assetsRef= useRef([]);
  const liabsRef = useRef([]);
  const debtsRef = useRef([]);
  const subsRef  = useRef([]);

  // ── DB mappers ─────────────────────────────────────────────────────────────
  const dbToTx   = d=>({id:d.id,type:d.type,amount:parseFloat(d.amount),category:d.category,note:d.note||'',date:d.date,recurring:d.recurring,autoLogged:d.auto_logged,autoKey:d.auto_key,fromBank:d.from_bank});
  const dbToBudg = d=>({id:d.id,category:d.category,limit:parseFloat(d.limit_amount),icon:d.icon,colour:d.colour});
  const dbToGoal = d=>({id:d.id,name:d.name,target:parseFloat(d.target),saved:parseFloat(d.saved),icon:d.icon,deadline:d.deadline});
  const dbToCal  = d=>({id:d.id,title:d.title,date:d.date,type:d.type,amount:d.amount?parseFloat(d.amount):null,recurring:d.recurring});
  const dbToAsset= d=>({id:d.id,name:d.name,type:d.type,value:parseFloat(d.value)});
  const dbToDebt = d=>({id:d.id,name:d.name,balance:parseFloat(d.balance),minPayment:parseFloat(d.min_payment),interest:parseFloat(d.interest),colour:d.colour});
  const dbToSub  = d=>({id:d.id,name:d.name,amount:parseFloat(d.amount),cycle:d.cycle,category:d.category,colour:d.colour,icon:d.icon,active:d.active,renewDate:d.renew_date});

  const txToDb   = (t,uid)=>({user_id:uid,type:t.type,amount:t.amount,category:t.category,note:t.note||'',date:t.date,recurring:t.recurring||false,auto_logged:t.autoLogged||false,auto_key:t.autoKey||null,from_bank:t.fromBank||null});
  const budgToDb = (b,uid)=>({user_id:uid,category:b.category,limit_amount:b.limit,icon:b.icon||null,colour:b.colour||null});
  const goalToDb = (g,uid)=>({user_id:uid,name:g.name,target:g.target,saved:g.saved,icon:g.icon,deadline:g.deadline||null});
  const calToDb  = (e,uid)=>({user_id:uid,title:e.title,date:e.date,type:e.type,amount:e.amount||null,recurring:e.recurring||false});
  const assetToDb= (a,uid)=>({user_id:uid,name:a.name,type:a.type,value:a.value});
  const debtToDb = (d,uid)=>({user_id:uid,name:d.name,balance:d.balance,min_payment:d.minPayment,interest:d.interest,colour:d.colour});
  const subToDb  = (s,uid)=>({user_id:uid,name:s.name,amount:s.amount,cycle:s.cycle,category:s.category,colour:s.colour,icon:s.icon,active:s.active,renew_date:s.renewDate||null});

  // ── Load all data from Supabase ────────────────────────────────────────────
  const loadAllData = async(uid)=>{
    setDataLoading(true);
    const [txR,budgR,goalsR,calR,assetsR,liabsR,debtsR,subsR,settR]=await Promise.all([
      supabase.from('transactions').select('*').eq('user_id',uid).order('date',{ascending:false}),
      supabase.from('budgets').select('*').eq('user_id',uid),
      supabase.from('goals').select('*').eq('user_id',uid),
      supabase.from('calendar_events').select('*').eq('user_id',uid),
      supabase.from('assets').select('*').eq('user_id',uid),
      supabase.from('liabilities').select('*').eq('user_id',uid),
      supabase.from('debts').select('*').eq('user_id',uid),
      supabase.from('subscriptions').select('*').eq('user_id',uid),
      supabase.from('settings').select('*').eq('user_id',uid).single(),
    ]);
    if(txR.data)    { txRef.current=txR.data.map(dbToTx);       setTxRaw(txRef.current); }
    if(budgR.data?.length) { budgRef.current=budgR.data.map(dbToBudg); setBudgRaw(budgRef.current); }
    if(goalsR.data) { goalsRef.current=goalsR.data.map(dbToGoal); setGoalsRaw(goalsRef.current); }
    if(calR.data)   { calRef.current=calR.data.map(dbToCal);     setCalRaw(calRef.current); }
    if(assetsR.data){ assetsRef.current=assetsR.data.map(dbToAsset); setAssetsRaw(assetsRef.current); }
    if(liabsR.data) { liabsRef.current=liabsR.data.map(dbToAsset); setLiabsRaw(liabsRef.current); }
    if(debtsR.data) { debtsRef.current=debtsR.data.map(dbToDebt); setDebtsRaw(debtsRef.current); }
    if(subsR.data)  { subsRef.current=subsR.data.map(dbToSub);   setSubsRaw(subsRef.current); }
    if(settR.data)  {
      if(settR.data.ef_saved!==null)    setEfSavedRaw(parseFloat(settR.data.ef_saved));
      if(settR.data.ef_expenses!==null) setEfExpensesRaw(parseFloat(settR.data.ef_expenses));
      if(settR.data.target_months)      setEfMonthsRaw(settR.data.target_months);
      if(settR.data.extra_payment!==null) setDebtExtraRaw(parseFloat(settR.data.extra_payment));
      if(settR.data.debt_method)        setDebtMethodRaw(settR.data.debt_method);
    }
    setDataLoading(false);
  };

  useEffect(()=>{ if(user) loadAllData(user.id); },[user?.id]);

  // ── Supabase sync helpers ──────────────────────────────────────────────────
  const syncReplace=async(table,items,toDb)=>{
    const uid=userRef.current?.id; if(!uid) return;
    await supabase.from(table).delete().eq('user_id',uid);
    if(items.length) await supabase.from(table).insert(items.map(i=>toDb(i,uid)));
  };

  const syncSettings=async(patch)=>{
    const uid=userRef.current?.id; if(!uid) return;
    await supabase.from('settings').upsert({user_id:uid,...patch});
  };

  // ── Tx smart sync (diff-based) ─────────────────────────────────────────────
  const setTx=useCallback((newOrFn)=>{
    const prev=txRef.current;
    const next=typeof newOrFn==='function'?newOrFn(prev):newOrFn;
    txRef.current=next; setTxRaw(next);
    const uid=userRef.current?.id; if(!uid) return;
    const prevMap=new Map(prev.map(t=>[t.id,t]));
    const nextMap=new Map(next.map(t=>[t.id,t]));
    const added=next.filter(t=>!prevMap.has(t.id));
    const deleted=prev.filter(t=>!nextMap.has(t.id));
    const updated=next.filter(t=>prevMap.has(t.id)&&JSON.stringify(t)!==JSON.stringify(prevMap.get(t.id)));
    if(deleted.length) deleted.forEach(t=>supabase.from('transactions').delete().eq('id',t.id).eq('user_id',uid));
    if(updated.length) updated.forEach(t=>supabase.from('transactions').update(txToDb(t,uid)).eq('id',t.id).eq('user_id',uid));
    if(added.length){
      supabase.from('transactions').insert(added.map(t=>txToDb(t,uid))).select().then(({data})=>{
        if(!data) return;
        const idMap=new Map(added.map((t,i)=>[t.id,data[i]?.id]));
        const updated2=txRef.current.map(t=>({...t,id:idMap.has(t.id)?idMap.get(t.id):t.id}));
        txRef.current=updated2; setTxRaw(updated2);
      });
    }
  },[]);

  // ── Other setters ──────────────────────────────────────────────────────────
  const setBudg=useCallback((n)=>{ const v=typeof n==='function'?n(budgRef.current):n; budgRef.current=v; setBudgRaw(v); syncReplace('budgets',v,budgToDb); },[]);
  const setGoals=useCallback((n)=>{ const v=typeof n==='function'?n(goalsRef.current):n; goalsRef.current=v; setGoalsRaw(v); syncReplace('goals',v,goalToDb); },[]);
  const setCal=useCallback((n)=>{ const v=typeof n==='function'?n(calRef.current):n; calRef.current=v; setCalRaw(v); syncReplace('calendar_events',v,calToDb); },[]);
  const setAssets=useCallback((n)=>{ const v=typeof n==='function'?n(assetsRef.current):n; assetsRef.current=v; setAssetsRaw(v); syncReplace('assets',v,assetToDb); },[]);
  const setLiabs=useCallback((n)=>{ const v=typeof n==='function'?n(liabsRef.current):n; liabsRef.current=v; setLiabsRaw(v); syncReplace('liabilities',v,assetToDb); },[]);
  const setDebts=useCallback((n)=>{ const v=typeof n==='function'?n(debtsRef.current):n; debtsRef.current=v; setDebtsRaw(v); syncReplace('debts',v,debtToDb); },[]);
  const setSubs=useCallback((n)=>{ const v=typeof n==='function'?n(subsRef.current):n; subsRef.current=v; setSubsRaw(v); syncReplace('subscriptions',v,subToDb); },[]);
  const setEfSaved=useCallback((v)=>{ setEfSavedRaw(v); syncSettings({ef_saved:v}); },[]);
  const setEfExpenses=useCallback((v)=>{ setEfExpensesRaw(v); syncSettings({ef_expenses:v}); },[]);
  const setEfMonths=useCallback((v)=>{ setEfMonthsRaw(v); syncSettings({target_months:v}); },[]);
  const setDebtExtra=useCallback((v)=>{ setDebtExtraRaw(v); syncSettings({extra_payment:v}); },[]);
  const setDebtMethod=useCallback((v)=>{ setDebtMethodRaw(v); syncSettings({debt_method:v}); },[]);

  const [rates,   setRates]   = useState({GBP:1,AUD:1.98,USD:1.27,EUR:1.17,CAD:1.72,NZD:2.14,JPY:190,CHF:1.13,ZAR:23.5,INR:105,AED:4.67,SGD:1.71,HKD:9.93,SEK:13.2,NOK:13.5,DKK:8.73,MXN:22.1,BRL:6.4,PLN:5.0,THB:44.5,MYR:5.95,PHP:72.3,IDR:20200,KRW:1700,TRY:40.5});
  const [tab,     setTab]     = useState('dashboard');
  const [modal,   setModal]   = useState(null);

  const th = isDark ? DK : LT;
  const currObj = CURRENCIES.find(c=>c.code===curr)||CURRENCIES[0];
  const rate    = rates[curr]||1;
  const fmt  = n => fmtCurrency(n*rate, curr, currObj.locale);
  const fmtS = n => {
    const v=n*rate;
    if(Math.abs(v)>=1000000) return fmtCurrency(v/1000000,curr,currObj.locale).replace(/[\d,.]+/,x=>(v/1000000).toFixed(1))+'M';
    return fmtCurrency(v,curr,currObj.locale);
  };

  useEffect(()=>{
    fetch('https://api.exchangerate-api.com/v4/latest/GBP')
      .then(r=>r.json())
      .then(d=>{ if(d.rates) setRates(prev=>({...prev,...d.rates,GBP:1})); })
      .catch(()=>{});
  },[]);

  const income  = tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const balance = income-expense;

  const now = new Date();
  const alerts = budg.map(b=>{
    const spent=tx.filter(t=>{
      const d=new Date(t.date);
      return t.type==='expense'&&t.category===b.category&&d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    }).reduce((s,t)=>s+t.amount,0);
    const pct=(spent/b.limit)*100;
    return {category:b.category,pct,spent,limit:b.limit,icon:CATS.find(c=>c.name===b.category)?.icon||'📦'};
  }).filter(a=>a.pct>=80);

  const [editTx, setEditTx] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const recurring = tx.filter(t=>t.recurring);

  // ── Recurring auto-log ─────────────────────────────────────────────────────
  useEffect(()=>{
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${now.getMonth()}`;
    const recurringEvents = cal.filter(e => e.recurring && e.amount);

    const newTx = [];
    recurringEvents.forEach(e => {
      const autoKey = `auto_${e.id}_${thisMonth}`;
      const alreadyLogged = tx.some(t => t.autoKey === autoKey);
      if(alreadyLogged) return;

      const isIncome = e.type === 'payday';
      newTx.push({
        id: Date.now() + Math.random(),
        type: isIncome ? 'income' : 'expense',
        amount: e.amount,
        category: isIncome ? 'Salary' : (e.type === 'subscription' ? 'Subscriptions' : e.type === 'bill' ? 'Bills' : 'Housing'),
        note: e.title,
        date: now.toISOString().split('T')[0],
        recurring: false,
        autoKey,
        autoLogged: true,
      });
    });

    if(newTx.length > 0) {
      setTx(prev => [...prev, ...newTx]);
    }
  }, [cal]);

  const ctx = {th,isDark,setIsDark,curr,setCurr,rates,currObj,fmt,fmtS,tx,setTx,budg,setBudg,goals,setGoals,cal,setCal,assets,setAssets,liabs,setLiabs,alerts,recurring,income,expense,balance,bDemo,setBDemo,setModal,editTx,setEditTx,confirmDeletes,setConfirmDeletes,pin,setPin,setAuthed,sidebarOpen,setSidebarOpen,debts,setDebts,subs,setSubs,efSaved,setEfSaved,efExpenses,setEfExpenses,efMonths,setEfMonths,debtExtra,setDebtExtra,debtMethod,setDebtMethod,user,supabase};

  const TAB_GROUPS=[
    {label:'Overview', tabs:[['dashboard','▦','Dashboard'],['monthly','◑','Monthly'],['alltime','∞','All Time']]},
    {label:'Money',    tabs:[['income','↑','Income'],['transactions','↕','Transactions'],['budgets','◫','Budgets']]},
    {label:'Planning', tabs:[['goals','◎','Goals'],['debt','❄','Debt Snowball'],['subs','◉','Subscriptions'],['emergency','🛡','Emergency Fund']]},
    {label:'Tools',    tabs:[['networth','◈','Net Worth'],['calendar','▤','Calendar'],['bank','⬡','Bank Connect']]},
  ];
  const TABS=TAB_GROUPS.flatMap(g=>g.tabs);

  // Auth checks
  if(authLoading) return (
    <div style={{minHeight:'100vh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:20,fontWeight:800,color:'#fff',marginBottom:12}}>Finance Tracker</div>
        <div style={{fontSize:12,color:'#333',letterSpacing:'.1em'}}>Loading...</div>
      </div>
    </div>
  );

  if(!user) return <AuthScreen/>;

  if(dataLoading) return (
    <div style={{minHeight:'100vh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:20,fontWeight:800,color:'#fff',marginBottom:12}}>Finance Tracker</div>
        <div style={{fontSize:12,color:'#333',letterSpacing:'.1em'}}>Loading your data...</div>
      </div>
    </div>
  );

  // Show PIN screen if set
  if(!authed) return <LoginScreen pin={pin} onAuth={()=>setAuthed(true)} isDark={isDark}/>;

  return (
    <Ctx.Provider value={ctx}>
      <div style={{minHeight:'100vh',background:th.bg,color:th.t,fontFamily:"'Plus Jakarta Sans',sans-serif",display:'flex',position:'relative'}}>
        <style>{mkCSS(th)}</style>

        {/* Mobile overlay backdrop */}
        {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'#000a',zIndex:40,display:'none'}} className="mob-backdrop"/>}

        {/* Sidebar */}
        <div className={`sidebar${sidebarOpen?' open':''}`} style={{width:230,background:th.s2,borderRight:`1px solid ${th.bd2}`,display:'flex',flexDirection:'column',padding:'30px 14px',flexShrink:0,position:'sticky',top:0,height:'100vh',overflowY:'auto',boxShadow:'4px 0 24px #00000018'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:32,paddingLeft:6}}>
            <div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,color:th.t,whiteSpace:'nowrap'}}>Finance Tracker</div>
              <div style={{width:32,height:2,background:`linear-gradient(90deg,${th.acc},transparent)`,borderRadius:1,marginTop:6}}/>
            </div>
            <button className="mob-close" onClick={()=>setSidebarOpen(false)} style={{background:'none',border:'none',color:th.t3,fontSize:20,cursor:'pointer',display:'none',padding:'4px'}}>✕</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:1,flex:1}}>
            {TAB_GROUPS.map((group,gi)=>(
              <div key={group.label} style={{marginBottom:6}}>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:800,letterSpacing:'.2em',textTransform:'uppercase',color:th.t2,padding:'10px 12px 4px',userSelect:'none',borderTop:`1px solid ${th.bd2}`,marginTop:4}}>{group.label}</div>
                {group.tabs.map(([k,ic,lb])=>(
                  <button key={k} className={`nb${tab===k?' on':''}`} onClick={()=>{setTab(k);setSidebarOpen(false);}}>
                    <span style={{fontSize:13,opacity:.7}}>{ic}</span>{lb}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div style={{borderTop:`1px solid ${th.bd2}`,paddingTop:16,marginTop:8}}>
            <div style={{paddingLeft:6,marginBottom:14}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:700,textTransform:'uppercase',color:th.t3,marginBottom:4}}>Net Balance</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:26,fontWeight:700,color:balance>=0?th.acc:th.exp,textShadow:balance>=0?'0 0 20px rgba(255,255,255,0.3)':'0 0 20px rgba(255,61,61,0.4)'}}>{fmtS(balance)}</div>
              {curr!=='GBP'&&<div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,color:th.t3,marginTop:3}}>1 GBP ≈ {(rates[curr]||1).toFixed(4)} {curr}</div>}
            </div>
            <div style={{display:'flex',gap:6}}>
              <button className="bout" onClick={()=>setIsDark(d=>!d)} style={{flex:1,padding:'8px 0',fontSize:11,textAlign:'center'}}>
                {isDark?'☀':'◑'}
              </button>
              <select value={curr} onChange={e=>setCurr(e.target.value)} style={{flex:1,padding:'8px 4px',fontSize:10,borderRadius:9,border:`1px solid ${th.bd}`,background:th.s2,color:th.t,fontWeight:700,cursor:'pointer'}}>
                {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <button className={`nb${tab==='settings'?' on':''}`} onClick={()=>{setTab('settings');setSidebarOpen(false);}} style={{width:38,padding:'8px',justifyContent:'center',flexShrink:0,borderRadius:9,border:`1px solid ${tab==='settings'?'transparent':th.bd}`,fontSize:16}}>⚙</button>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{flex:1,overflowY:'auto',minHeight:'100vh',background:th.bg,display:'flex',flexDirection:'column'}}>
          {/* Mobile top bar */}
          <div className="mob-topbar" style={{display:'none',alignItems:'center',gap:12,padding:'16px 20px',background:th.s2,borderBottom:`1px solid ${th.bd2}`,position:'sticky',top:0,zIndex:30}}>
            <button onClick={()=>setSidebarOpen(true)} style={{background:'none',border:'none',color:th.t,fontSize:22,cursor:'pointer',padding:'2px',lineHeight:1}}>☰</button>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:th.t}}>Finance Tracker</div>
            <button className="btn" onClick={()=>setModal('tx')} style={{marginLeft:'auto',padding:'8px 14px',fontSize:11}}>+ Add</button>
          </div>

          <div style={{padding:'40px 48px',flex:1}} className="main-pad">
            <div key={tab} className="tabcontent">
              {tab==='dashboard'    && <DashTab    onAdd={()=>setModal('tx')}/>}
              {tab==='alltime'      && <AllTimeTab/>}
              {tab==='income'       && <IncomeTab  onAdd={()=>{setEditTx({type:'income'});setModal('tx');}}/>}
              {tab==='transactions' && <TxTab      onAdd={()=>setModal('tx')}/>}
              {tab==='budgets'      && <BudgTab onNew={()=>setModal('budget')}/>}
              {tab==='goals'        && <GoalTab    onNew={()=>setModal('goal')}/>}
              {tab==='calendar'     && <CalTab     onNew={()=>setModal('event')}/>}
              {tab==='monthly'      && <MonthlyTab/>}
              {tab==='networth'     && <NWTab/>}
              {tab==='debt'         && <DebtTab/>}
              {tab==='subs'         && <SubsTab/>}
              {tab==='emergency'    && <EmergencyTab/>}
              {tab==='bank'         && <BankTab/>}
              {tab==='settings'     && <SettingsTab/>}
            </div>
          </div>
        </div>
      </div>

      {modal==='tx'     && <TxModal     onClose={()=>{setModal(null);setEditTx(null);}}/>}
      {modal==='goal'   && <GoalModal   onClose={()=>setModal(null)}/>}
      {modal==='event'  && <EventModal  onClose={()=>setModal(null)}/>}
      {modal==='budget' && <BudgetModal onClose={()=>setModal(null)}/>}
      {modal==='asset'  && <AssetModal type="asset"     onClose={()=>setModal(null)}/>}
      {modal==='liab'   && <AssetModal type="liability" onClose={()=>setModal(null)}/>}

      {/* Floating add button */}
      {!modal&&(
        <button
          onClick={()=>setModal('tx')}
          style={{
            position:'fixed',bottom:28,right:28,zIndex:100,
            width:56,height:56,borderRadius:'50%',
            background:`#ffffff`,
            border:'none',color:'#000',fontSize:26,fontWeight:700,
            cursor:'pointer',boxShadow:`0 0 24px rgba(255,255,255,0.25),0 0 48px rgba(255,255,255,0.08)`,
            display:'flex',alignItems:'center',justifyContent:'center',
            transition:'all .18s cubic-bezier(.4,0,.2,1)',
            lineHeight:1,
          }}
          className="fab"
          onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.12)';e.currentTarget.style.boxShadow=`0 0 32px rgba(255,255,255,0.35),0 0 60px rgba(255,255,255,0.12)`;}}
          onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow=`0 0 24px rgba(255,255,255,0.25),0 0 48px rgba(255,255,255,0.08)`;}}
          title="Add transaction"
        >+</button>
      )}
    </Ctx.Provider>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────────
function Hdr({title,sub,children}) {
  const {th}=useCtx();
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:28}}>
      <div>
        <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:28,fontWeight:800,color:th.t,lineHeight:1.1}}>{title}</h1>
        {sub&&<div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,color:th.t3,marginTop:5}}>{sub}</div>}
      </div>
      <div style={{display:'flex',gap:10}}>{children}</div>
    </div>
  );
}

function TxRow({t,onDel,showYear}) {
  const {th,fmt,setModal,setEditTx}=useCtx();
  const cat=CATS.find(c=>c.name===t.category);
  const isInc=t.type==='income';
  const amtSize=t.amount>=500?15:t.amount>=100?14:13;
  const amtWeight=t.amount>=500?700:500;
  const amtOpacity=t.amount>=500?1:t.amount>=100?0.85:t.amount>=50?0.7:0.55;
  return (
    <div className="txr">
      <div style={{width:36,height:36,borderRadius:10,background:th.s2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>{cat?.icon||(isInc?'💵':'📦')}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:500,color:th.t,display:'flex',alignItems:'center',gap:6}}>
          {t.note||t.category}
          {t.recurring&&<span style={{fontSize:8,fontWeight:700,color:th.t3,background:th.s2,border:`1px solid ${th.bd}`,padding:'1px 5px',borderRadius:3}}>REC</span>}
          {t.autoLogged&&<span style={{fontSize:8,fontWeight:700,color:th.acc,background:th.accBg,padding:'1px 5px',borderRadius:3}}>AUTO</span>}
        </div>
        <div className="mono" style={{marginTop:2}}>{t.category} · {new Date(t.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',...(showYear?{year:'numeric'}:{})})}{t.fromBank?` · ${t.fromBank}`:''}</div>
      </div>
      <span className="chip" style={{background:isInc?th.incBg:th.expBg,color:isInc?th.inc:th.exp}}>{t.type}</span>
      <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:amtSize,fontWeight:amtWeight,color:isInc?th.inc:th.exp,minWidth:90,textAlign:'right',opacity:amtOpacity}}>
        {isInc?'+':'−'}{fmt(t.amount)}
      </span>
      <button className="delbtn" title="Edit" onClick={()=>{setEditTx(t);setModal('tx');}}>✎</button>
      {onDel&&<button className="delbtn" onClick={onDel}>✕</button>}
    </div>
  );
}

function EmptyState({icon, title, sub, action, onAction}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {sub&&<div className="empty-sub">{sub}</div>}
      {action&&<button className="btn" style={{marginTop:8}} onClick={onAction}>{action}</button>}
    </div>
  );
}

function Alerts() {
  const {th,alerts,fmt}=useCtx();
  if(!alerts.length) return null;
  return (
    <div style={{marginBottom:20}}>
      <div className="sl">⚠ Budget Alerts</div>
      {alerts.map(a=>(
        <div key={a.category} className="alertbar" style={{background:a.pct>100?th.expBg:`${th.exp}18`,border:`1px solid ${a.pct>100?th.exp:th.exp+'44'}`}}>
          <span style={{fontSize:16}}>{a.icon}</span>
          <span style={{flex:1,color:th.t,fontWeight:500}}>{a.category}</span>
          <span style={{color:a.pct>100?th.exp:th.t2,fontSize:11}}>
            {fmt(a.spent)} / {fmt(a.limit)} · <strong>{a.pct.toFixed(0)}%</strong> {a.pct>100?'OVER BUDGET':'used'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Insights Strip ────────────────────────────────────────────────────────────
function InsightsStrip({mIncome,mExpense,mBalance,pIncome,pExpense}) {
  const {th}=useCtx();
  const insights=[];
  const d=(curr,prev)=>{
    if(!prev||prev===0) return null;
    const pct=Math.abs(((curr-prev)/prev)*100).toFixed(0);
    return {pct,up:curr>=prev};
  };
  const incD=d(mIncome,pIncome);
  const expD=d(mExpense,pExpense);
  const savingsRate=mIncome>0?((mBalance/mIncome)*100):0;
  if(incD) insights.push({icon:incD.up?'📈':'📉',text:`Income is ${incD.up?'up':'down'} ${incD.pct}% vs last month`});
  if(expD) insights.push({icon:expD.up?'⚠️':'✅',text:`Spending is ${expD.up?'up':'down'} ${expD.pct}% vs last month`});
  if(mIncome>0) insights.push({icon:savingsRate>=20?'🏆':savingsRate>=0?'💡':'🔴',text:`Saving ${savingsRate.toFixed(0)}% of income this month`});
  if(!insights.length) return null;
  return (
    <div style={{display:'flex',gap:10,marginBottom:22,flexWrap:'wrap'}}>
      {insights.map((ins,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:th.s,border:`1px solid ${th.bd}`,borderRadius:10,fontSize:12,color:th.t2,flex:'1 1 200px'}}>
          <span style={{fontSize:16}}>{ins.icon}</span>
          <span>{ins.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function DashTab({onAdd}) {
  const {th,fmt,fmtS,tx,budg,goals,recurring,setTx,cal,subs,setModal,setEditTx}=useCtx();
  const now=new Date();

  // This month only
  const monthTx=tx.filter(t=>{
    const d=new Date(t.date);
    return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  });
  const mIncome =monthTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const mExpense=monthTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const mBalance=mIncome-mExpense;

  // Previous month for delta
  const prevTx=tx.filter(t=>{
    const d=new Date(t.date);
    const p=new Date(now.getFullYear(),now.getMonth()-1,1);
    return d.getMonth()===p.getMonth()&&d.getFullYear()===p.getFullYear();
  });
  const pIncome =prevTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const pExpense=prevTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);

  const delta=(curr,prev)=>{
    if(!prev||prev===0) return null;
    const pct=((curr-prev)/prev)*100;
    return {pct:Math.abs(pct).toFixed(0),up:curr>=prev};
  };

  // This month by category for pie
  const expByCat=CATS.map(c=>({...c,value:monthTx.filter(t=>t.type==='expense'&&t.category===c.name).reduce((s,t)=>s+t.amount,0)})).filter(c=>c.value>0);

  const last6=Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);
    const m=d.getMonth(),y=d.getFullYear();
    return {
      label:d.toLocaleString('en-GB',{month:'short'}),
      income: tx.filter(t=>{const td=new Date(t.date);return t.type==='income' &&td.getMonth()===m&&td.getFullYear()===y;}).reduce((s,t)=>s+t.amount,0),
      expense:tx.filter(t=>{const td=new Date(t.date);return t.type==='expense'&&td.getMonth()===m&&td.getFullYear()===y;}).reduce((s,t)=>s+t.amount,0),
    };
  });

  const addRecurring=(t)=>{
    const today=new Date().toISOString().split('T')[0];
    setTx(prev=>[...prev,{...t,id:Date.now(),date:today,recurring:false,note:`(Recurring) ${t.note||t.category}`}]);
  };

  const monthName=now.toLocaleString('en-GB',{month:'long',year:'numeric'});

  const Delta=({d,invert})=>{
    if(!d) return null;
    const good=invert?!d.up:d.up;
    return <span style={{fontSize:11,color:good?th.inc:th.exp,marginLeft:8}}>{d.up?'↑':'↓'}{d.pct}%</span>;
  };

  return (
    <>
      <Hdr title="Dashboard" sub={monthName}><button className="btn" onClick={onAdd}>+ Add Transaction</button></Hdr>
      <Alerts/>

      {/* Monthly summary cards */}
      <div className="g3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:22}}>
        {[
          {l:'This Month\'s Income',  v:mIncome,  c:th.inc, d:delta(mIncome,pIncome),   inv:false},
          {l:'This Month\'s Expenses',v:mExpense, c:th.exp, d:delta(mExpense,pExpense), inv:true},
          {l:'Net This Month',     v:mBalance, c:mBalance>=0?th.acc:th.exp, d:null},
        ].map(c=>(
          <div key={c.l} className="card">
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,textTransform:'uppercase',color:th.acc,marginBottom:12}}>{c.l}</div>
            <div style={{display:'flex',alignItems:'baseline',gap:4,flexWrap:'wrap'}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:34,fontWeight:700,color:c.c,lineHeight:1}}>{fmtS(c.v)}</div>
              {c.d&&<Delta d={c.d} invert={c.inv}/>}
            </div>
            {c.d&&<div style={{fontSize:11,color:th.t3,marginTop:6}}>vs last month</div>}
          </div>
        ))}
      </div>

      {/* Insights strip */}
      {(mIncome>0||mExpense>0)&&<InsightsStrip mIncome={mIncome} mExpense={mExpense} mBalance={mBalance} pIncome={pIncome} pExpense={pExpense}/>}

      <div className="g32" style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:16,marginBottom:22}}>
        <div className="card">
          <div className="sl">6-Month Cash Flow</div>
          <ResponsiveContainer width="100%" height={165}>
            <AreaChart data={last6} margin={{top:0,right:0,left:-24,bottom:0}}>
              <defs>
                <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" stopOpacity={.25}/><stop offset="100%" stopColor="#4ade80" stopOpacity={0}/></linearGradient>
                <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f87171" stopOpacity={.25}/><stop offset="100%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{fill:th.t3,fontSize:12}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:th.t3,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`£${v}`}/>
              <Tooltip contentStyle={{background:'#111',border:'1px solid #2a2a2a',borderRadius:10,color:'#ffffff',fontSize:12}} itemStyle={{color:'#ffffff'}} labelStyle={{color:'#aaaaaa'}} formatter={(v,n)=>[fmt(v),(n||'value').charAt(0).toUpperCase()+(n||'value').slice(1)]}/>
              <Area type="monotone" dataKey="income"  stroke={th.inc} strokeWidth={2} fill="url(#gi)" dot={false}/>
              <Area type="monotone" dataKey="expense" stroke={th.exp} strokeWidth={2} fill="url(#ge)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:20,marginTop:10}}>
            {[['#4ade80','Income'],['#f87171','Expenses']].map(([c,l])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:7,fontSize:11,color:th.t3,fontFamily:"'Plus Jakarta Sans',sans-serif",textTransform:'uppercase'}}>
                <div style={{width:18,height:2,background:c,borderRadius:1}}/>{l}
              </div>
            ))}
          </div>
        </div>

        {/* This month category breakdown */}
        <div className="card">
          <div className="sl">This Month by Category</div>
          {expByCat.length===0
            ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:165,color:th.t4,fontSize:13}}>No expenses this month</div>
            :<>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={expByCat} dataKey="value" innerRadius={36} outerRadius={52} paddingAngle={3} stroke="none">
                    {expByCat.map((e,i)=><Cell key={i} fill={e.c}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'#111',border:'1px solid #2a2a2a',borderRadius:10,color:'#ffffff',fontSize:12}} itemStyle={{color:'#ffffff'}} labelStyle={{color:'#aaaaaa'}} formatter={(v,n)=>[fmt(v),(n||'value').charAt(0).toUpperCase()+(n||'value').slice(1)]}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {expByCat.slice(0,4).map(c=>(
                  <div key={c.name} style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:7,height:7,borderRadius:2,background:c.c,flexShrink:0}}/>
                    <span style={{fontSize:12,color:th.t2,flex:1}}>{c.name}</span>
                    <span className="mono" style={{fontSize:12}}>{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          }
        </div>
      </div>

      {/* Recurring */}
      {recurring.length>0&&(
        <div className="card" style={{marginBottom:22}}>
          <div className="sl">Recurring Transactions</div>
          {recurring.map(t=>(
            <div key={t.id} className="txr">
              <div style={{width:36,height:36,borderRadius:10,background:th.s2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>{CATS.find(c=>c.name===t.category)?.icon||'📦'}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:500,color:th.t}}>{t.note||t.category}</div>
                <div className="mono" style={{marginTop:2}}>{t.category} · monthly</div>
              </div>
              <span className="mono" style={{color:t.type==='income'?th.inc:th.exp,fontSize:13}}>{t.type==='income'?'+':'−'}{fmt(t.amount)}</span>
              <button className="delbtn vis" title="Edit" onClick={()=>{setEditTx(t);setModal('tx');}}>✎</button>
              <button className="delbtn vis" onClick={()=>setTx(tx.filter(x=>x.id!==t.id))}>✕</button>
              <button className="btn" style={{padding:'7px 14px',fontSize:11,marginLeft:4}} onClick={()=>addRecurring(t)}>+ This Month</button>
            </div>
          ))}
        </div>
      )}

      {/* Goals widget */}
      {goals.length>0&&(
        <div className="card" style={{marginBottom:22}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
            <div className="sl" style={{marginBottom:0}}>Savings Goals</div>
            <span className="mono" style={{fontSize:11}}>{goals.filter(g=>g.saved>=g.target).length}/{goals.length} complete</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14}}>
            {goals.map(g=>{
              const pct=Math.min((g.saved/g.target)*100,100);
              const done=g.saved>=g.target;
              return (
                <div key={g.id} style={{padding:'18px',background:th.s2,borderRadius:14,border:`1px solid ${done?th.acc+'44':th.bd2}`,position:'relative',overflow:'hidden'}}>
                  {done&&<div style={{position:'absolute',top:10,right:10,fontSize:10,fontWeight:700,color:th.acc,background:th.accBg,padding:'2px 7px',borderRadius:4}}>DONE ✓</div>}
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <span style={{fontSize:22}}>{g.icon}</span>
                    <div>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:th.t}}>{g.name}</div>
                      <div className="mono" style={{marginTop:2,fontSize:11}}>Target {fmt(g.target)}</div>
                    </div>
                  </div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:26,fontWeight:700,color:done?th.acc:th.t,marginBottom:8}}>{fmt(g.saved)}</div>
                  <div className="prog" style={{height:6,marginBottom:6}}>
                    <div className="pfill" style={{width:`${pct}%`,background:done?th.acc:th.acc+'99'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:th.t3}}>
                    <span>{pct.toFixed(0)}%</span>
                    <span>{done?'Complete!':fmt(g.target-g.saved)+' left'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming payments + Recent transactions */}
      <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

        {/* Upcoming scheduled payments */}
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div className="sl" style={{marginBottom:0}}>Upcoming Payments</div>
          </div>
          {(()=>{
            const today=new Date();
            // Calendar events
            const calPayments=cal
              .filter(e=>e.amount&&(e.type==='bill'||e.type==='subscription'||e.type==='payday'))
              .map(e=>{
                const d=new Date(e.date);
                let next=new Date(today.getFullYear(),today.getMonth(),d.getDate());
                if(next<today) next=new Date(today.getFullYear(),today.getMonth()+1,d.getDate());
                const daysLeft=Math.ceil((next-today)/(1000*60*60*24));
                return {id:`cal_${e.id}`,title:e.title,amount:e.amount,type:e.type,nextDate:next,daysLeft};
              });
            // Active subscriptions with renewal dates
            const subPayments=subs.filter(s=>s.active&&s.renewDate).map(s=>{
              const d=new Date(s.renewDate);
              let next=new Date(today.getFullYear(),today.getMonth(),d.getDate());
              if(next<today) next=new Date(today.getFullYear(),today.getMonth()+1,d.getDate());
              const daysLeft=Math.ceil((next-today)/(1000*60*60*24));
              return {id:`sub_${s.id}`,title:s.name,amount:s.amount,type:'subscription',icon:s.icon,nextDate:next,daysLeft};
            });
            const upcoming=[...calPayments,...subPayments].sort((a,b)=>a.daysLeft-b.daysLeft).slice(0,6);
            if(upcoming.length===0) return <EmptyState icon="📅" title="No upcoming payments" sub="Add calendar events or subscriptions with amounts to see them here."/>;
            const EVT_COLORS={payday:th.inc,bill:th.exp,subscription:'#A855F7'};
            return upcoming.map(e=>(
              <div key={e.id} className="txr">
                <div style={{width:36,height:36,borderRadius:10,background:th.s2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>
                  {e.icon||(e.type==='payday'?'💰':e.type==='subscription'?'📱':'📄')}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,color:th.t}}>{e.title}</div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:th.t3,marginTop:2}}>
                    {e.daysLeft===0?'Today':e.daysLeft===1?'Tomorrow':`In ${e.daysLeft} days`} · {e.nextDate.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                  </div>
                </div>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:600,color:EVT_COLORS[e.type]||th.t,flexShrink:0}}>
                  -{fmt(e.amount)}
                </span>
              </div>
            ));
          })()}
        </div>

        {/* Recent this month */}
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div className="sl" style={{marginBottom:0}}>Recent Transactions</div>
            <span className="mono" style={{fontSize:11}}>{monthTx.length} this month</span>
          </div>
          {monthTx.length===0
            ?<EmptyState icon="📭" title="No transactions this month" sub="Add your first transaction for the month to get started." action="+ Add Transaction" onAction={onAdd}/>
            :monthTx.slice().reverse().slice(0,6).map(t=><TxRow key={t.id} t={t} onDel={()=>setTx(tx.filter(x=>x.id!==t.id))}/>)
          }
        </div>

      </div>
    </>
  );
}

// ── All Time ──────────────────────────────────────────────────────────────────
function AllTimeTab() {
  const {th,tx,fmt,fmtS,goals}=useCtx();

  const income  = tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const balance = income-expense;

  // All-time by category
  const expByCat=CATS.map(c=>({
    ...c,value:tx.filter(t=>t.type==='expense'&&t.category===c.name).reduce((s,t)=>s+t.amount,0)
  })).filter(c=>c.value>0).sort((a,b)=>b.value-a.value);

  const incByCat=['Salary','Freelance','Investment','Gift','Other'].map(cat=>({
    name:cat,
    value:tx.filter(t=>t.type==='income'&&t.category===cat).reduce((s,t)=>s+t.amount,0)
  })).filter(c=>c.value>0).sort((a,b)=>b.value-a.value);

  // Monthly breakdown — all months with data
  const months=[];
  const seen=new Set();
  tx.forEach(t=>{
    const d=new Date(t.date);
    const key=`${d.getFullYear()}-${d.getMonth()}`;
    if(!seen.has(key)){seen.add(key);months.push({year:d.getFullYear(),month:d.getMonth(),label:d.toLocaleString('en-GB',{month:'short',year:'2-digit'})});}
  });
  months.sort((a,b)=>a.year!==b.year?a.year-b.year:a.month-b.month);

  const monthData=months.map(({year,month,label})=>({
    label,
    income: tx.filter(t=>{const d=new Date(t.date);return t.type==='income' &&d.getMonth()===month&&d.getFullYear()===year;}).reduce((s,t)=>s+t.amount,0),
    expense:tx.filter(t=>{const d=new Date(t.date);return t.type==='expense'&&d.getMonth()===month&&d.getFullYear()===year;}).reduce((s,t)=>s+t.amount,0),
  }));

  // Biggest single transactions
  const biggestIncome =tx.filter(t=>t.type==='income').sort((a,b)=>b.amount-a.amount).slice(0,5);
  const biggestExpense=tx.filter(t=>t.type==='expense').sort((a,b)=>b.amount-a.amount).slice(0,5);

  const avgMonthlyIncome  = months.length>0 ? income/months.length  : 0;
  const avgMonthlyExpense = months.length>0 ? expense/months.length : 0;

  return (
    <>
      <Hdr title="All Time" sub={`${tx.length} transactions across ${months.length} months`}/>

      {/* Top stats */}
      <div className="g3" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {[
          {l:'Total Income',   v:income,  c:th.inc},
          {l:'Total Expenses', v:expense, c:th.exp},
          {l:'Net Balance',    v:balance, c:balance>=0?th.acc:th.exp},
          {l:'Months Tracked', v:months.length, c:th.t, raw:true},
        ].map(c=>(
          <div key={c.l} className="card">
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,textTransform:'uppercase',color:th.acc,marginBottom:10}}>{c.l}</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:30,fontWeight:700,color:c.c,lineHeight:1}}>{c.raw?c.v:fmtS(c.v)}</div>
          </div>
        ))}
      </div>

      {/* Averages */}
      <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:22}}>
        <div className="card">
          <div className="sl">Monthly Averages</div>
          <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[{l:'Avg Income',v:avgMonthlyIncome,c:th.inc},{l:'Avg Expenses',v:avgMonthlyExpense,c:th.exp}].map(c=>(
              <div key={c.l} style={{padding:'14px',background:th.s2,borderRadius:10,border:`1px solid ${th.bd2}`}}>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:700,textTransform:'uppercase',color:th.t3,marginBottom:8}}>{c.l}</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,color:c.c}}>{fmtS(c.v)}</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,color:th.t4,marginTop:4}}>per month</div>
              </div>
            ))}
          </div>
        </div>

        {/* Savings rate */}
        <div className="card">
          <div className="sl">Savings Rate</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:52,fontWeight:700,color:th.acc,lineHeight:1,marginBottom:10}}>
            {income>0?((balance/income)*100).toFixed(1):0}%
          </div>
          <div className="prog" style={{height:8,marginBottom:8}}>
            <div className="pfill" style={{width:`${Math.max(0,Math.min((balance/income)*100,100))}%`,background:`linear-gradient(90deg,${th.acc},${th.accMid})`}}/>
          </div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:th.t3}}>{fmtS(balance)} saved of {fmtS(income)} earned</div>
        </div>
      </div>

      {/* Full history chart */}
      {monthData.length>0&&(
        <div className="card" style={{marginBottom:22}}>
          <div className="sl">Full History — Monthly Cash Flow</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthData} margin={{top:0,right:0,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="agi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" stopOpacity={.25}/><stop offset="100%" stopColor="#4ade80" stopOpacity={0}/></linearGradient>
                <linearGradient id="age" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f87171" stopOpacity={.25}/><stop offset="100%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{fill:th.t3,fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:th.t3,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`£${v}`}/>
              <Tooltip contentStyle={{background:'#111',border:'1px solid #2a2a2a',borderRadius:10,color:'#ffffff',fontSize:12}} itemStyle={{color:'#ffffff'}} labelStyle={{color:'#aaaaaa'}} formatter={(v,n)=>[fmt(v),(n||'value').charAt(0).toUpperCase()+(n||'value').slice(1)]}/>
              <Area type="monotone" dataKey="income"  stroke={th.inc} strokeWidth={2} fill="url(#agi)" dot={monthData.length<24}/>
              <Area type="monotone" dataKey="expense" stroke={th.exp} strokeWidth={2} fill="url(#age)" dot={monthData.length<24}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:22}}>
        {/* Expense breakdown */}
        <div className="card">
          <div className="sl">All-Time Spending by Category</div>
          {expByCat.length===0
            ?<div style={{color:th.t4,fontSize:13,textAlign:'center',padding:'24px 0'}}>No expenses yet</div>
            :expByCat.map(c=>{
              const pct=expense>0?((c.value/expense)*100):0;
              return (
                <div key={c.name} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                    <span style={{fontSize:13,color:th.t,fontWeight:500}}>{c.icon} {c.name}</span>
                    <div style={{textAlign:'right'}}>
                      <span className="mono" style={{fontSize:12}}>{fmt(c.value)}</span>
                      <span style={{fontSize:10,color:th.t3,marginLeft:6}}>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="prog">
                    <div className="pfill" style={{width:`${pct}%`,background:c.c}}/>
                  </div>
                </div>
              );
            })
          }
        </div>

        {/* Income breakdown */}
        <div className="card">
          <div className="sl">All-Time Income by Source</div>
          {incByCat.length===0
            ?<div style={{color:th.t4,fontSize:13,textAlign:'center',padding:'24px 0'}}>No income yet</div>
            :incByCat.map((c,i)=>{
              const pct=income>0?((c.value/income)*100):0;
              const shades=['#00FF88','#00cc70','#009955','#006633','#003311'];
              const col=shades[i]||shades[shades.length-1];
              return (
                <div key={c.name} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                    <span style={{fontSize:13,color:th.t,fontWeight:500}}>{c.name}</span>
                    <div style={{textAlign:'right'}}>
                      <span className="mono" style={{fontSize:12}}>{fmt(c.value)}</span>
                      <span style={{fontSize:10,color:th.t3,marginLeft:6}}>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="prog">
                    <div className="pfill" style={{width:`${pct}%`,background:col}}/>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Biggest transactions */}
      <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div className="card">
          <div className="sl">Biggest Income</div>
          {biggestIncome.length===0
            ?<div style={{color:th.t4,fontSize:13,textAlign:'center',padding:'20px 0'}}>No income yet</div>
            :biggestIncome.map(t=><TxRow key={t.id} t={t}/>)
          }
        </div>
        <div className="card">
          <div className="sl">Biggest Expenses</div>
          {biggestExpense.length===0
            ?<div style={{color:th.t4,fontSize:13,textAlign:'center',padding:'20px 0'}}>No expenses yet</div>
            :biggestExpense.map(t=><TxRow key={t.id} t={t}/>)
          }
        </div>
      </div>
    </>
  );
}

// ── Transactions ──────────────────────────────────────────────────────────────
// ── Income ────────────────────────────────────────────────────────────────────
function IncomeTab({onAdd}) {
  const {th,tx,setTx,fmt,fmtS}=useCtx();
  const [mFilter,setMFilter]=useState('all');
  const [catFilter,setCatFilter]=useState('all');
  const [search,setSearch]=useState('');

  const now=new Date();
  const incomeTx=tx.filter(t=>t.type==='income');

  const monthOpts=[
    {v:'all',l:'All Time'},
    ...Array.from({length:6},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      return {v:`${d.getFullYear()}-${d.getMonth()}`,l:d.toLocaleString('en-GB',{month:'long',year:'numeric'})};
    })
  ];

  const filtered=incomeTx.filter(t=>{
    if(catFilter!=='all'&&t.category!==catFilter) return false;
    if(search&&!(t.note||'').toLowerCase().includes(search.toLowerCase())&&!t.category.toLowerCase().includes(search.toLowerCase())) return false;
    if(mFilter!=='all'){
      const [y,m]=mFilter.split('-').map(Number);
      const d=new Date(t.date);
      if(d.getFullYear()!==y||d.getMonth()!==m) return false;
    }
    return true;
  }).slice().reverse();

  const totalIncome=incomeTx.reduce((s,t)=>s+t.amount,0);

  // This month's income
  const thisMonthIncome=incomeTx.filter(t=>{
    const d=new Date(t.date);
    return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  }).reduce((s,t)=>s+t.amount,0);

  // Income by source/category
  const byCat=ICATS.map(cat=>({
    name:cat,
    total:incomeTx.filter(t=>t.category===cat).reduce((s,t)=>s+t.amount,0),
  })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  const mainSource=byCat[0]?.name||'None';
  const allCats=[...new Set(incomeTx.map(t=>t.category))];

  const last6Income=Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);
    const m=d.getMonth(),y=d.getFullYear();
    return {
      label:d.toLocaleString('en-GB',{month:'short'}),
      total:incomeTx.filter(t=>{const td=new Date(t.date);return td.getMonth()===m&&td.getFullYear()===y;}).reduce((s,t)=>s+t.amount,0),
    };
  });

  const exportCSV=()=>{
    const rows=[['Date','Category','Amount (GBP)','Note','Source'],
      ...filtered.map(t=>[t.date,t.category,t.amount.toFixed(2),t.note||'',t.fromBank||'Manual'])];
    const csv=rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    Object.assign(document.createElement('a'),{href:'data:text/csv;charset=utf-8,'+encodeURIComponent(csv),download:'income.csv'}).click();
  };

  return (
    <>
      <Hdr title="Income" sub={`${incomeTx.length} income entries`}>
        <button className="bout" onClick={exportCSV}>↓ CSV</button>
        <button className="btn" onClick={onAdd}>+ Add Income</button>
      </Hdr>

      {/* Summary cards */}
      <div className="g3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        <div className="card">
          <div className="sl" style={{marginBottom:10}}>Total Income</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:30,fontWeight:700,color:th.inc}}>{fmtS(totalIncome)}</div>
        </div>
        <div className="card">
          <div className="sl" style={{marginBottom:10}}>This Month</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:30,fontWeight:700,color:th.acc}}>{fmtS(thisMonthIncome)}</div>
        </div>
        <div className="card">
          <div className="sl" style={{marginBottom:10}}>Main Source</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,color:th.t}}>{mainSource}</div>
        </div>
      </div>

      {/* Visual income breakdown */}
      {byCat.length>0&&(
        <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>

          {/* Donut + legend */}
          <div className="card">
            <div className="sl">Income Split</div>
            <div style={{display:'flex',alignItems:'center',gap:24}}>
              <div style={{position:'relative',flexShrink:0}}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={byCat.map((c,i)=>({...c,value:c.total}))} dataKey="value"
                      innerRadius={52} outerRadius={72} paddingAngle={3} stroke="none"
                      startAngle={90} endAngle={-270}>
                      {byCat.map((_,i)=>{
                        const shades=['#00FF88','#00cc70','#009955','#006633','#003311'];
                        return <Cell key={i} fill={shades[i]||shades[shades.length-1]}/>;
                      })}
                    </Pie>
                    <Tooltip contentStyle={{background:'#111',border:'1px solid #2a2a2a',borderRadius:10,color:'#ffffff',fontSize:12}} itemStyle={{color:'#ffffff'}} labelStyle={{color:'#aaaaaa'}} formatter={(v,n)=>[fmt(v),(n||'value').charAt(0).toUpperCase()+(n||'value').slice(1)]}/>
                  </PieChart>
                </ResponsiveContainer>
                {/* Centre label */}
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:800,color:th.t,lineHeight:1.1}}>{fmtS(totalIncome)}</div>
                  <div style={{fontSize:9,color:th.t3,fontFamily:"'Plus Jakarta Sans',sans-serif",marginTop:2}}>TOTAL</div>
                </div>
              </div>
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:10}}>
                {byCat.map((c,i)=>{
                  const shades=['#00FF88','#00cc70','#009955','#006633','#003311'];
                  const col=shades[i]||shades[shades.length-1];
                  const pct=totalIncome>0?((c.total/totalIncome)*100):0;
                  return (
                    <div key={c.name}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                        <div style={{display:'flex',alignItems:'center',gap:7}}>
                          <div style={{width:8,height:8,borderRadius:2,background:col,flexShrink:0}}/>
                          <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:600,color:th.t2}}>{c.name}</span>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:col,fontWeight:500}}>{fmt(c.total)}</span>
                          <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,color:th.t4,marginLeft:6}}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="prog">
                        <div className="pfill" style={{width:`${pct}%`,background:col}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stacked proportion bar */}
            <div style={{marginTop:20}}>
              <div style={{fontSize:10,color:th.t4,fontWeight:700,textTransform:'uppercase',marginBottom:6}}>Proportion</div>
              <div style={{display:'flex',height:10,borderRadius:5,overflow:'hidden',gap:1}}>
                {byCat.map((c,i)=>{
                  const shades=['#00FF88','#00cc70','#009955','#006633','#003311'];
                  const pct=totalIncome>0?((c.total/totalIncome)*100):0;
                  return <div key={c.name} style={{flex:pct,background:shades[i]||shades[shades.length-1],minWidth:pct>0?4:0,transition:'flex .4s ease'}}/>;
                })}
              </div>
              <div style={{display:'flex',gap:14,marginTop:8,flexWrap:'wrap'}}>
                {byCat.map((c,i)=>{
                  const shades=['#00FF88','#00cc70','#009955','#006633','#003311'];
                  return (
                    <div key={c.name} style={{display:'flex',alignItems:'center',gap:5}}>
                      <div style={{width:6,height:6,borderRadius:1,background:shades[i]||shades[shades.length-1]}}/>
                      <span style={{fontSize:10,color:th.t3,fontWeight:600,textTransform:'uppercase'}}>{c.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 6-month income trend */}
          <div className="card">
            <div className="sl">Monthly Trend</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={last6Income} margin={{top:0,right:0,left:-24,bottom:0}}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={th.inc} stopOpacity={.25}/>
                    <stop offset="100%" stopColor={th.inc} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{fill:th.t3,fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:th.t3,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`£${v}`}/>
                <Tooltip contentStyle={{background:'#111',border:'1px solid #2a2a2a',borderRadius:10,color:'#ffffff',fontSize:12}} itemStyle={{color:'#ffffff'}} labelStyle={{color:'#aaaaaa'}} formatter={(v,n)=>[fmt(v),n.charAt(0).toUpperCase()+n.slice(1)]}/>
                <Area type="monotone" dataKey="total" stroke={th.inc} strokeWidth={2} fill="url(#incGrad)" dot={{fill:th.inc,r:3,strokeWidth:0}}/>
              </AreaChart>
            </ResponsiveContainer>

            {/* Month-on-month change */}
            {last6Income.length>=2&&(
              <div style={{marginTop:16,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                {last6Income.slice(-3).map((m,i,arr)=>{
                  const prev=last6Income[last6Income.length-3+i-1];
                  const change=prev&&prev.total>0?((m.total-prev.total)/prev.total*100):null;
                  return (
                    <div key={m.label} style={{padding:'10px 12px',background:th.s2,borderRadius:9,border:`1px solid ${th.bd2}`}}>
                      <div style={{fontSize:9,color:th.t4,fontWeight:700,textTransform:'uppercase',marginBottom:5}}>{m.label}</div>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:th.t}}>{fmtS(m.total)}</div>
                      {change!==null&&(
                        <div style={{fontSize:10,color:change>=0?th.inc:th.exp,marginTop:3}}>
                          {change>=0?'↑':'↓'}{Math.abs(change).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="frow">
        <select value={mFilter} onChange={e=>setMFilter(e.target.value)} style={{width:180,padding:'8px 12px',fontSize:12}}>
          {monthOpts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{width:140,padding:'8px 12px',fontSize:12}}>
          <option value="all">All Sources</option>
          {allCats.map(c=><option key={c}>{c}</option>)}
        </select>
        <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:120,padding:'8px 12px',fontSize:12}}/>
        {(mFilter!=='all'||catFilter!=='all'||search)&&(
          <button className="bout" style={{padding:'8px 12px',fontSize:11}} onClick={()=>{setMFilter('all');setCatFilter('all');setSearch('');}}>✕ Clear</button>
        )}
      </div>

      <div className="card">
        {filtered.length===0
          ?<div style={{color:th.t4,textAlign:'center',padding:'40px 0',fontSize:13}}>
            {incomeTx.length===0?'No income recorded yet — add your first entry above':'No income matches your filters'}
          </div>
          :filtered.map(t=><TxRow key={t.id} t={t} showYear onDel={()=>setTx(tx.filter(x=>x.id!==t.id))}/>)
        }
      </div>
    </>
  );
}

// ── Transactions ──────────────────────────────────────────────────────────────
function TxTab({onAdd}) {
  const {th,tx,setTx,fmt}=useCtx();
  const [mFilter,setMFilter]=useState('all');
  const [catFilter,setCatFilter]=useState('all');
  const [typeFilter,setTypeFilter]=useState('all');
  const [search,setSearch]=useState('');

  const now=new Date();
  const monthOpts=[
    {v:'all',l:'All Time'},
    ...Array.from({length:6},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      return {v:`${d.getFullYear()}-${d.getMonth()}`,l:d.toLocaleString('en-GB',{month:'long',year:'numeric'})};
    })
  ];

  const filtered=tx.filter(t=>{
    if(typeFilter!=='all'&&t.type!==typeFilter) return false;
    if(catFilter!=='all'&&t.category!==catFilter) return false;
    if(search&&!(t.note||'').toLowerCase().includes(search.toLowerCase())&&!t.category.toLowerCase().includes(search.toLowerCase())) return false;
    if(mFilter!=='all'){
      const [y,m]=mFilter.split('-').map(Number);
      const d=new Date(t.date);
      if(d.getFullYear()!==y||d.getMonth()!==m) return false;
    }
    return true;
  }).reverse();

  const exportCSV=()=>{
    const rows=[['Date','Type','Category','Amount (GBP)','Note','Recurring'],...filtered.map(t=>[t.date,t.type,t.category,t.amount.toFixed(2),t.note||'',t.recurring?'Yes':'No'])];
    const csv=rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const a=Object.assign(document.createElement('a'),{href:'data:text/csv;charset=utf-8,'+encodeURIComponent(csv),download:'ledger-transactions.csv'});
    a.click();
  };

  const allCats=[...new Set(tx.map(t=>t.category))];

  return (
    <>
      <Hdr title="Transactions" sub={`${filtered.length} of ${tx.length} entries`}>
        <button className="bout" onClick={exportCSV}>↓ CSV</button>
        <button className="btn" onClick={onAdd}>+ Add</button>
      </Hdr>
      <div className="frow">
        <select value={mFilter} onChange={e=>setMFilter(e.target.value)} style={{width:180,padding:'8px 12px',fontSize:12}}>
          {monthOpts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{width:120,padding:'8px 12px',fontSize:12}}>
          <option value="all">All Types</option><option value="income">Income</option><option value="expense">Expense</option>
        </select>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{width:140,padding:'8px 12px',fontSize:12}}>
          <option value="all">All Categories</option>
          {allCats.map(c=><option key={c}>{c}</option>)}
        </select>
        <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:120,padding:'8px 12px',fontSize:12}}/>
        {(mFilter!=='all'||catFilter!=='all'||typeFilter!=='all'||search)&&(
          <button className="bout" style={{padding:'8px 12px',fontSize:11}} onClick={()=>{setMFilter('all');setCatFilter('all');setTypeFilter('all');setSearch('');}}>✕ Clear</button>
        )}
      </div>
      <div className="card">
        {filtered.length===0
          ?<EmptyState icon="↕" title={tx.length===0?'No transactions yet':'No matches'} sub={tx.length===0?'Add your first transaction to start tracking your finances.':'Try adjusting your filters.'} action={tx.length===0?'+ Add Transaction':null} onAction={onAdd}/>
          :filtered.map(t=><TxRow key={t.id} t={t} showYear onDel={()=>setTx(tx.filter(x=>x.id!==t.id))}/>)
        }
      </div>
    </>
  );
}

// ── Budgets ───────────────────────────────────────────────────────────────────
function BudgTab({onNew}) {
  const {th,tx,budg,setBudg,fmt}=useCtx();
  const now=new Date();
  const monthName=now.toLocaleString('en-GB',{month:'long',year:'numeric'});

  const deleteBudget=(category)=>{
    if(window.confirm(`Delete the "${category}" budget?`)) setBudg(budg.filter(b=>b.category!==category));
  };

  // Only count this month's spending
  const spentThisMonth=(category)=>tx.filter(t=>{
    const d=new Date(t.date);
    return t.type==='expense'&&t.category===category&&d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  }).reduce((s,t)=>s+t.amount,0);

  const totalBudget=budg.reduce((s,b)=>s+b.limit,0);
  const totalSpent=budg.reduce((s,b)=>s+spentThisMonth(b.category),0);

  return (
    <>
      <Hdr title="Budgets" sub={`${monthName} · resets 1st of each month`}>
        <button className="btn" onClick={onNew}>+ New Budget</button>
      </Hdr>

      {/* Month summary bar */}
      {budg.length>0&&(
        <div className="card" style={{marginBottom:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:12}}>
            <div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,textTransform:'uppercase',color:th.acc,marginBottom:4}}>Monthly Total</div>
              <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:32,fontWeight:700,color:totalSpent>totalBudget?th.exp:th.t}}>{fmt(totalSpent)}</span>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,color:th.t3}}>of {fmt(totalBudget)}</span>
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:26,fontWeight:700,color:totalSpent>totalBudget?th.exp:th.acc}}>{totalBudget>0?((totalSpent/totalBudget)*100).toFixed(0):0}%</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:th.t3,marginTop:2}}>{fmt(Math.max(0,totalBudget-totalSpent))} remaining</div>
            </div>
          </div>
          <div className="prog" style={{height:8}}>
            <div className="pfill" style={{width:`${Math.min((totalSpent/totalBudget)*100,100)}%`,background:totalSpent>totalBudget?th.exp:`linear-gradient(90deg,${th.acc},${th.accMid})`}}/>
          </div>
        </div>
      )}

      {budg.length===0&&(
        <div className="card"><EmptyState icon="◫" title="No budgets yet" sub="Create a budget category to track your monthly spending limits." action="+ New Budget" onAction={onNew}/></div>
      )}
      <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {budg.map((b,i)=>{
          const cat=CATS.find(c=>c.name===b.category);
          const icon=b.icon||(cat?.icon||'📦');
          const colour=b.colour||(cat?.c||th.acc);
          const spent=spentThisMonth(b.category);
          const pct=Math.min((spent/b.limit)*100,100);
          const over=spent>b.limit;
          return (
            <div key={b.category} className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:36,height:36,borderRadius:9,background:colour+'18',border:`1px solid ${colour}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0}}>{icon}</div>
                  <div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:th.t}}>{b.category}</div>
                    <div className="mono" style={{marginTop:1}}>Limit {fmt(b.limit)}/mo</div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                  <div style={{textAlign:'right'}}>
                    <div className="mono" style={{fontSize:13,color:over?th.exp:th.t}}>{fmt(spent)}</div>
                    <div style={{fontSize:10,color:over?th.exp:th.t3,marginTop:1}}>{over?`${fmt(spent-b.limit)} over`:`${fmt(b.limit-spent)} left`}</div>
                  </div>
                  <button className="delbtn vis" title="Delete budget" onClick={()=>deleteBudget(b.category)}>✕</button>
                </div>
              </div>
              <div className="prog" style={{marginBottom:12}}>
                <div className="pfill" style={{width:`${pct}%`,background:over?th.exp:colour}}/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <label style={{margin:0,flex:1}}>Monthly limit</label>
                <input type="number" value={b.limit} onChange={e=>setBudg(budg.map((x,j)=>j===i?{...x,limit:+e.target.value}:x))} style={{width:100,textAlign:'right',padding:'6px 10px',fontSize:13}}/>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Goals ─────────────────────────────────────────────────────────────────────
function GoalTab({onNew}) {
  const {th,goals,setGoals,fmt,tx}=useCtx();
  const now=new Date();

  // Calculate average monthly savings from income - expense
  const last3Months=Array.from({length:3},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const m=d.getMonth(),y=d.getFullYear();
    const inc=tx.filter(t=>{const td=new Date(t.date);return t.type==='income'&&td.getMonth()===m&&td.getFullYear()===y;}).reduce((s,t)=>s+t.amount,0);
    const exp=tx.filter(t=>{const td=new Date(t.date);return t.type==='expense'&&td.getMonth()===m&&td.getFullYear()===y;}).reduce((s,t)=>s+t.amount,0);
    return inc-exp;
  });
  const avgMonthlySaving=last3Months.reduce((s,v)=>s+v,0)/3;

  return (
    <>
      <Hdr title="Savings Goals" sub="Track your targets"><button className="btn" onClick={onNew}>+ New Goal</button></Hdr>
      {goals.length===0&&<div className="card"><EmptyState icon="◎" title="No goals yet" sub="Set a savings target and track your progress towards it." action="+ New Goal" onAction={onNew}/></div>}
      <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {goals.map(g=>{
          const pct=Math.min((g.saved/g.target)*100,100);
          const remaining=g.target-g.saved;
          const done=g.saved>=g.target;

          // Time estimates
          let monthsNeeded=null,monthsLeft=null,onTrack=null;
          if(!done&&avgMonthlySaving>0) monthsNeeded=Math.ceil(remaining/avgMonthlySaving);
          if(g.deadline){
            const deadlineDate=new Date(g.deadline);
            const diff=(deadlineDate-now)/(1000*60*60*24*30.5);
            monthsLeft=Math.max(0,Math.round(diff));
            if(monthsLeft>0) onTrack=remaining<=monthsLeft*avgMonthlySaving;
          }

          return (
            <div key={g.id} className="card" style={{border:done?`1px solid ${th.acc}44`:g.deadline&&!onTrack&&monthsLeft!==null?`1px solid ${th.exp}22`:`1px solid ${th.bd}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:24}}>{g.icon}</span>
                  <div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:700,color:th.t}}>{g.name}</div>
                    <div className="mono" style={{marginTop:1}}>Target {fmt(g.target)}</div>
                  </div>
                </div>
                <button className="delbtn vis" onClick={()=>setGoals(goals.filter(x=>x.id!==g.id))}>✕</button>
              </div>

              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:28,fontWeight:700,marginBottom:10,color:done?th.acc:th.t}}>{fmt(g.saved)}</div>
              <div className="prog" style={{marginBottom:8}}>
                <div className="pfill" style={{width:`${pct}%`,background:done?th.acc:th.acc+'99'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:th.t3,marginBottom:14}}>
                <span>{pct.toFixed(0)}%</span>
                <span>{done?'Complete!':fmt(remaining)+' to go'}</span>
              </div>

              {/* Insights row */}
              {!done&&(
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
                  {monthsNeeded!==null&&(
                    <span style={{fontSize:10,fontWeight:700,color:th.t3,background:th.s2,border:`1px solid ${th.bd2}`,padding:'3px 8px',borderRadius:6}}>
                      ~{monthsNeeded}mo at current rate
                    </span>
                  )}
                  {g.deadline&&(
                    <span style={{fontSize:10,fontWeight:700,color:onTrack?th.inc:th.exp,background:onTrack?th.incBg:th.expBg,padding:'3px 8px',borderRadius:6}}>
                      {monthsLeft}mo left · {onTrack?'On track':'Behind'}
                    </span>
                  )}
                  {g.deadline&&(
                    <span style={{fontSize:10,fontWeight:700,color:th.t3,background:th.s2,border:`1px solid ${th.bd2}`,padding:'3px 8px',borderRadius:6}}>
                      Due {new Date(g.deadline).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                    </span>
                  )}
                </div>
              )}

              <div style={{display:'flex',gap:8}}>
                <input type="number" placeholder="Add £..." id={`g${g.id}`} style={{flex:1,padding:'8px 11px',fontSize:13}}/>
                <button className="btn" style={{padding:'8px 14px',fontSize:11}} onClick={()=>{
                  const el=document.getElementById(`g${g.id}`);
                  const amt=parseFloat(el.value);
                  if(!isNaN(amt)&&amt>0){setGoals(goals.map(x=>x.id===g.id?{...x,saved:Math.min(x.saved+amt,x.target)}:x));el.value='';}
                }}>Add</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function CalTab({onNew}) {
  const {th,cal,setCal,fmt,tx}=useCtx();
  const today=new Date();
  const [cur,setCur]=useState({month:today.getMonth(),year:today.getFullYear()});
  const [sel,setSel]=useState(null);

  const thisMonth=`${today.getFullYear()}-${today.getMonth()}`;
  const autoLoggedThisMonth=tx.filter(t=>t.autoLogged&&t.autoKey?.endsWith(thisMonth));

  const dim=new Date(cur.year,cur.month+1,0).getDate();
  const fdow=(new Date(cur.year,cur.month,1).getDay()+6)%7;
  const evOn=day=>cal.filter(e=>{const d=new Date(e.date);return d.getDate()===day&&d.getMonth()===cur.month&&d.getFullYear()===cur.year;});
  const upcoming=cal.filter(e=>new Date(e.date)>=today).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,8);
  const billsTotal=cal.filter(e=>{const d=new Date(e.date);return(e.type==='bill'||e.type==='subscription')&&d.getMonth()===cur.month&&d.getFullYear()===cur.year;}).reduce((s,e)=>s+(e.amount||0),0);
  const paydayTotal=cal.filter(e=>{const d=new Date(e.date);return e.type==='payday'&&d.getMonth()===cur.month&&d.getFullYear()===cur.year;}).reduce((s,e)=>s+(e.amount||0),0);

  return (
    <>
      <Hdr title="Calendar" sub="Paydays, bills & scheduled payments"><button className="btn" onClick={onNew}>+ Add Event</button></Hdr>
      {autoLoggedThisMonth.length>0&&(
        <div style={{marginBottom:16,padding:'12px 16px',background:th.accBg,borderRadius:10,border:`1px solid ${th.acc}44`,display:'flex',alignItems:'center',gap:10,fontSize:13,color:th.t}}>
          <span style={{fontSize:16}}>⚡</span>
          <span><strong>{autoLoggedThisMonth.length} recurring payment{autoLoggedThisMonth.length>1?'s':''}</strong> were automatically logged to your transactions this month: {autoLoggedThisMonth.map(t=>t.note).join(', ')}.</span>
        </div>
      )}
      <div className="g32" style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:14}}>
        <div className="card" style={{padding:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <button className="bout" style={{padding:'6px 13px'}} onClick={()=>setCur(c=>{const m=c.month-1<0?11:c.month-1;return{month:m,year:c.month-1<0?c.year-1:c.year};})}>‹</button>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:700,color:th.t}}>{MONTHS[cur.month]} {cur.year}</div>
            <button className="bout" style={{padding:'6px 13px'}} onClick={()=>setCur(c=>{const m=c.month+1>11?0:c.month+1;return{month:m,year:c.month+1>11?c.year+1:c.year};})}>›</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:3}}>
            {DAYS.map(d=><div key={d} style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:9,fontWeight:700,color:th.t4,textAlign:'center',padding:'3px 0'}}>{d}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
            {Array.from({length:fdow}).map((_,i)=><div key={`e${i}`}/>)}
            {Array.from({length:dim},(_,i)=>{
              const day=i+1,evs=evOn(day);
              const isToday=day===today.getDate()&&cur.month===today.getMonth()&&cur.year===today.getFullYear();
              return (
                <div key={day} className={`ccell${isToday?' tod':''}`} onClick={()=>setSel({day,evs})}>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:isToday?800:400,color:isToday?th.t:th.t3,marginBottom:2}}>{day}</div>
                  {evs.slice(0,2).map(e=>(
                    <div key={e.id} style={{fontSize:8,fontWeight:700,background:EVT[e.type]?.bg,color:EVT[e.type]?.color,borderRadius:3,padding:'1px 4px',marginBottom:2,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{e.title}</div>
                  ))}
                  {evs.length>2&&<div style={{fontSize:8,color:th.t4}}>+{evs.length-2}</div>}
                </div>
              );
            })}
          </div>
          {sel&&sel.evs.length>0&&(
            <div style={{marginTop:14,padding:14,background:th.s2,borderRadius:10,border:`1px solid ${th.bd2}`}}>
              <div className="sl" style={{marginBottom:10}}>{sel.day} {MONTHS[cur.month]}</div>
              {sel.evs.map(e=>(
                <div key={e.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <div className="evdot" style={{background:EVT[e.type]?.color}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:th.t}}>{e.title}</div>
                    {e.amount&&<div className="mono" style={{marginTop:1}}>{fmt(e.amount)} · {EVT[e.type]?.label}</div>}
                  </div>
                  <button className="delbtn vis" onClick={()=>{setCal(cal.filter(x=>x.id!==e.id));setSel(null);}}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div className="cardsm"><div className="sl" style={{marginBottom:8,fontSize:9}}>Bills / Subs</div><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:th.exp}}>{fmt(billsTotal)}</div></div>
            <div className="cardsm"><div className="sl" style={{marginBottom:8,fontSize:9}}>Paydays</div><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:th.inc}}>{fmt(paydayTotal)}</div></div>
          </div>
          <div className="card" style={{flex:1,padding:16}}>
            <div className="sl">Upcoming</div>
            {upcoming.length===0?<div style={{color:th.t4,fontSize:12,textAlign:'center',padding:'16px 0'}}>Nothing scheduled</div>
              :upcoming.map(e=>(
                <div key={e.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:11}}>
                  <div className="evdot" style={{background:EVT[e.type]?.color}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,color:th.t,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{e.title}</div>
                    <div className="mono" style={{marginTop:1}}>{new Date(e.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}{e.amount?` · ${fmt(e.amount)}`:''}</div>
                  </div>
                  {e.recurring&&<span style={{fontSize:8,fontWeight:700,color:th.t4,background:th.s2,border:`1px solid ${th.bd}`,padding:'2px 5px',borderRadius:3}}>REC</span>}
                </div>
              ))
            }
          </div>
          <div className="cardsm">
            <div className="sl" style={{marginBottom:10}}>Legend</div>
            {Object.entries(EVT).map(([k,v])=>(
              <div key={k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
                <div className="evdot" style={{background:v.color}}/>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:700,textTransform:'uppercase',color:th.t3}}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Monthly Summary ───────────────────────────────────────────────────────────
function MonthlyTab() {
  const {th,tx,budg,fmt,fmtS}=useCtx();
  const now=new Date();
  const [sel,setSel]=useState({month:now.getMonth(),year:now.getFullYear()});

  const monthOpts=Array.from({length:12},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    return {month:d.getMonth(),year:d.getFullYear(),label:d.toLocaleString('en-GB',{month:'long',year:'numeric'})};
  });

  const txThisMonth=tx.filter(t=>{
    const d=new Date(t.date);
    return d.getMonth()===sel.month&&d.getFullYear()===sel.year;
  });

  // Previous month
  const prevDate=new Date(sel.year,sel.month-1,1);
  const txPrevMonth=tx.filter(t=>{
    const d=new Date(t.date);
    return d.getMonth()===prevDate.getMonth()&&d.getFullYear()===prevDate.getFullYear();
  });

  const mIncome =txThisMonth.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const mExpense=txThisMonth.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const mBalance=mIncome-mExpense;
  const pIncome =txPrevMonth.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const pExpense=txPrevMonth.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);

  const expByCat=CATS.map(c=>({
    ...c,
    value:txThisMonth.filter(t=>t.type==='expense'&&t.category===c.name).reduce((s,t)=>s+t.amount,0),
    budget:budg.find(b=>b.category===c.name)?.limit||0,
  })).filter(c=>c.value>0);

  const delta=(curr,prev)=>{
    if(!prev) return null;
    const pct=((curr-prev)/prev)*100;
    return {pct,up:curr>prev};
  };

  const incDelta=delta(mIncome,pIncome);
  const expDelta=delta(mExpense,pExpense);

  const DeltaBadge=({d,invertColour})=>{
    if(!d||!isFinite(d.pct)) return null;
    const positive=invertColour?!d.up:d.up;
    return (
      <span style={{fontSize:10,fontWeight:700,color:positive?th.inc:th.exp,background:positive?th.incBg:th.expBg,padding:'2px 7px',borderRadius:4,marginLeft:8}}>
        {d.up?'↑':'↓'}{Math.abs(d.pct).toFixed(0)}% vs prev
      </span>
    );
  };

  return (
    <>
      <Hdr title="Monthly Summary" sub="Income, spending & breakdown by month"/>

      {/* Month picker */}
      <div style={{display:'flex',gap:8,marginBottom:22,alignItems:'center'}}>
        <select value={`${sel.year}-${sel.month}`} onChange={e=>{const[y,m]=e.target.value.split('-');setSel({year:+y,month:+m});}} style={{width:220,padding:'9px 13px',fontSize:13}}>
          {monthOpts.map(o=><option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>{o.label}</option>)}
        </select>
        <span className="mono" style={{fontSize:10}}>{txThisMonth.length} transactions</span>
      </div>

      {/* Stat cards */}
      <div className="g3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        {[
          {l:'Income',    v:mIncome,  c:th.inc, d:incDelta, inv:false},
          {l:'Expenses',  v:mExpense, c:th.exp, d:expDelta, inv:true},
          {l:'Saved',     v:mBalance, c:mBalance>=0?th.acc:th.exp, d:null},
        ].map(c=>(
          <div key={c.l} className="card">
            <div className="sl" style={{marginBottom:10}}>{c.l}</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:30,fontWeight:700,color:c.c}}>{fmtS(c.v)}</div>
            {c.d&&<DeltaBadge d={c.d} invertColour={c.inv}/>}
          </div>
        ))}
      </div>

      <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
        {/* Pie chart */}
        <div className="card">
          <div className="sl">Spending Breakdown</div>
          {expByCat.length===0
            ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:th.t4,fontSize:13}}>No expenses this month</div>
            :<>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={expByCat} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={3} stroke="none">
                    {expByCat.map((e,i)=><Cell key={i} fill={e.c}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'#111',border:'1px solid #2a2a2a',borderRadius:10,color:'#ffffff',fontSize:12}} itemStyle={{color:'#ffffff'}} labelStyle={{color:'#aaaaaa'}} formatter={(v,n)=>[fmt(v),(n||'value').charAt(0).toUpperCase()+(n||'value').slice(1)]}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
                {expByCat.map(c=>{
                  const pct=mExpense>0?((c.value/mExpense)*100).toFixed(0):0;
                  return (
                    <div key={c.name} style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:13}}>{c.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                          <span style={{fontSize:12,color:th.t2}}>{c.name}</span>
                          <span className="mono" style={{fontSize:11}}>{fmt(c.value)} <span style={{color:th.t3}}>({pct}%)</span></span>
                        </div>
                        <div className="prog">
                          <div className="pfill" style={{width:`${pct}%`,background:c.c}}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          }
        </div>

        {/* vs Budget */}
        <div className="card">
          <div className="sl">vs Budget</div>
          {expByCat.length===0
            ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:th.t4,fontSize:13}}>No expenses this month</div>
            :expByCat.map(c=>{
              const pct=c.budget>0?Math.min((c.value/c.budget)*100,100):0;
              const over=c.budget>0&&c.value>c.budget;
              return (
                <div key={c.name} style={{marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                    <span style={{fontSize:12,color:th.t,fontWeight:500}}>{c.icon} {c.name}</span>
                    <span className="mono" style={{fontSize:11,color:over?th.exp:th.t2}}>
                      {fmt(c.value)}{c.budget?` / ${fmt(c.budget)}`:''}
                    </span>
                  </div>
                  {c.budget>0
                    ?<><div className="prog"><div className="pfill" style={{width:`${pct}%`,background:over?th.exp:th.acc}}/></div>
                      <div style={{fontSize:10,color:over?th.exp:th.t3,marginTop:3,textAlign:'right'}}>{over?`${fmt(c.value-c.budget)} over budget`:`${fmt(c.budget-c.value)} remaining`}</div>
                    </>
                    :<div style={{fontSize:10,color:th.t4,marginTop:2}}>No budget set</div>
                  }
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Transactions this month */}
      <div className="card">
        <div className="sl">{txThisMonth.length} Transactions This Month</div>
        {txThisMonth.length===0
          ?<div style={{color:th.t4,textAlign:'center',padding:'28px 0',fontSize:13}}>No transactions recorded this month</div>
          :txThisMonth.slice().reverse().map(t=><TxRow key={t.id} t={t}/>)
        }
      </div>
    </>
  );
}

// ── Net Worth ─────────────────────────────────────────────────────────────────
function NWTab() {
  const {th,fmt,fmtS,assets,setAssets,liabs,setLiabs,setModal}=useCtx();
  const totalA=assets.reduce((s,a)=>s+a.value,0);
  const totalL=liabs.reduce((s,l)=>s+l.value,0);
  const nw=totalA-totalL;

  return (
    <>
      <Hdr title="Net Worth" sub="Assets minus liabilities"/>
      <div className="g3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        {[{l:'Net Worth',v:nw,c:nw>=0?th.acc:th.exp},{l:'Total Assets',v:totalA,c:th.inc},{l:'Total Liabilities',v:totalL,c:th.exp}].map(c=>(
          <div key={c.l} className="card"><div className="sl" style={{marginBottom:10}}>{c.l}</div><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:30,fontWeight:700,color:c.c}}>{fmtS(c.v)}</div></div>
        ))}
      </div>
      <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div className="sl" style={{marginBottom:0}}>Assets</div>
            <button className="btn" style={{padding:'7px 14px',fontSize:11}} onClick={()=>setModal('asset')}>+ Add</button>
          </div>
          {assets.length===0&&<div style={{color:th.t4,fontSize:13,textAlign:'center',padding:'20px 0'}}>No assets yet</div>}
          {assets.map(a=>(
            <div key={a.id} className="txr">
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:th.t}}>{a.name}</div>
                <div className="mono" style={{marginTop:1}}>{a.type}</div>
              </div>
              <span className="mono" style={{color:th.inc}}>{fmt(a.value)}</span>
              <button className="delbtn" onClick={()=>setAssets(assets.filter(x=>x.id!==a.id))}>✕</button>
            </div>
          ))}
          {assets.length>0&&<div style={{borderTop:`1px solid ${th.bd2}`,marginTop:8,paddingTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,textTransform:'uppercase',color:th.t3}}>Total</span>
            <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,color:th.inc}}>{fmt(totalA)}</span>
          </div>}
        </div>
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div className="sl" style={{marginBottom:0}}>Liabilities</div>
            <button className="btn" style={{padding:'7px 14px',fontSize:11}} onClick={()=>setModal('liab')}>+ Add</button>
          </div>
          {liabs.length===0&&<div style={{color:th.t4,fontSize:13,textAlign:'center',padding:'20px 0'}}>No liabilities yet</div>}
          {liabs.map(l=>(
            <div key={l.id} className="txr">
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:th.t}}>{l.name}</div>
                <div className="mono" style={{marginTop:1}}>{l.type}</div>
              </div>
              <span className="mono" style={{color:th.exp}}>{fmt(l.value)}</span>
              <button className="delbtn" onClick={()=>setLiabs(liabs.filter(x=>x.id!==l.id))}>✕</button>
            </div>
          ))}
          {liabs.length>0&&<div style={{borderTop:`1px solid ${th.bd2}`,marginTop:8,paddingTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,textTransform:'uppercase',color:th.t3}}>Total</span>
            <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,color:th.exp}}>{fmt(totalL)}</span>
          </div>}
        </div>
      </div>
    </>
  );
}

// ── Debt Snowball ─────────────────────────────────────────────────────────────
function DebtTab() {
  const {th,fmt,fmtS,debts,setDebts,debtExtra:extraPayment,setDebtExtra:setExtraPayment,debtMethod:method,setDebtMethod:setMethod}=useCtx();
  const [showAdd,setShowAdd]=useState(false);
  const [newDebt,setNewDebt]=useState({name:'',balance:'',minPayment:'',interest:'',colour:'#f87171'});

  const COLOURS=['#f87171','#fb923c','#fbbf24','#a3e635','#34d399','#22d3ee','#60a5fa','#a78bfa','#f472b6'];

  const totalDebt=debts.reduce((s,d)=>s+d.balance,0);
  const totalMin=debts.reduce((s,d)=>s+d.minPayment,0);

  // Sort by method
  const sorted=debts.slice().sort((a,b)=>
    method==='snowball' ? a.balance-b.balance :  // smallest first
    method==='avalanche'? b.interest-a.interest : // highest interest first
    0
  );

  // Simulate payoff timeline
  const simulate=()=>{
    if(debts.length===0) return [];
    let remaining=debts.map(d=>({...d,bal:d.balance}));
    remaining.sort((a,b)=>method==='snowball'?a.balance-b.balance:b.interest-a.interest);

    const timeline=[];
    let month=0;
    let extra=extraPayment;

    while(remaining.some(d=>d.bal>0)&&month<360){
      month++;
      // Apply interest
      remaining=remaining.map(d=>({...d,bal:d.bal>0?d.bal*(1+d.interest/100/12):0}));

      // Pay minimums on all
      let leftover=extra;
      remaining=remaining.map(d=>{
        if(d.bal<=0) return d;
        const pay=Math.min(d.minPayment,d.bal);
        return {...d,bal:Math.max(0,d.bal-pay)};
      });

      // Find the target debt (first with balance in sorted order)
      const target=remaining.find(d=>d.bal>0);
      if(target&&leftover>0){
        const pay=Math.min(leftover,target.bal);
        target.bal=Math.max(0,target.bal-pay);
      }

      const totalLeft=remaining.reduce((s,d)=>s+d.bal,0);
      timeline.push({month,total:totalLeft,snapshot:remaining.map(d=>({...d}))});

      if(totalLeft<=0.01) break;
    }
    return timeline;
  };

  const timeline=simulate();
  const payoffMonths=timeline.length;
  const payoffYears=Math.floor(payoffMonths/12);
  const payoffRemainingMonths=payoffMonths%12;

  // Total interest paid
  const totalPaid=debts.reduce((s,d)=>s+(d.minPayment*payoffMonths),0)+extraPayment*payoffMonths;
  const totalInterest=Math.max(0,totalPaid-totalDebt);

  // When does each debt get paid off?
  const payoffDates=debts.map(d=>{
    const idx=timeline.findIndex(t=>t.snapshot.find(s=>s.id===d.id)?.bal<=0.01);
    return {id:d.id,month:idx===-1?payoffMonths:idx+1};
  });

  const addDebt=()=>{
    if(!newDebt.name||!newDebt.balance||!newDebt.minPayment||!newDebt.interest) return;
    setDebts([...debts,{...newDebt,id:Date.now(),balance:+newDebt.balance,minPayment:+newDebt.minPayment,interest:+newDebt.interest}]);
    setNewDebt({name:'',balance:'',minPayment:'',interest:'',colour:'#f87171'});
    setShowAdd(false);
  };

  const updateDebt=(id,field,val)=>setDebts(debts.map(d=>d.id===id?{...d,[field]:field==='name'||field==='colour'?val:+val}:d));
  const removeDebt=(id)=>setDebts(debts.filter(d=>d.id!==id));

  return (
    <>
      <Hdr title="Debt Snowball" sub="Pay off your debts fastest with the snowball or avalanche method">
        <button className="btn" onClick={()=>setShowAdd(s=>!s)}>+ Add Debt</button>
      </Hdr>

      {/* Method selector */}
      <div style={{display:'flex',gap:10,marginBottom:20}}>
        {[
          {k:'snowball',label:'❄ Snowball',desc:'Smallest balance first — quick wins keep you motivated'},
          {k:'avalanche',label:'🔥 Avalanche',desc:'Highest interest first — saves the most money overall'},
        ].map(m=>(
          <div key={m.k} onClick={()=>setMethod(m.k)} style={{flex:1,padding:'16px 18px',background:method===m.k?th.accBg:th.s,border:`1px solid ${method===m.k?th.acc:th.bd}`,borderRadius:12,cursor:'pointer',transition:'all .15s'}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:method===m.k?th.acc:th.t,marginBottom:4}}>{m.label}</div>
            <div style={{fontSize:12,color:th.t3,lineHeight:1.5}}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Summary cards */}
      <div className="g3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        <div className="card">
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,textTransform:'uppercase',color:th.acc,marginBottom:10}}>Total Debt</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:32,fontWeight:700,color:th.exp}}>{fmtS(totalDebt)}</div>
        </div>
        <div className="card">
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,textTransform:'uppercase',color:th.acc,marginBottom:10}}>Debt-Free In</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:32,fontWeight:700,color:th.t}}>
            {payoffYears>0?`${payoffYears}y `:''}
            {payoffRemainingMonths>0?`${payoffRemainingMonths}mo`:''}
            {payoffMonths===0?'Debt free!':''}
          </div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:th.t3,marginTop:4}}>{totalMin+extraPayment}/mo total payments</div>
        </div>
        <div className="card">
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,textTransform:'uppercase',color:th.acc,marginBottom:10}}>Est. Interest</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:32,fontWeight:700,color:th.exp}}>{fmtS(totalInterest)}</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:th.t3,marginTop:4}}>at current payment rate</div>
        </div>
      </div>

      {/* Extra payment slider */}
      <div className="card" style={{marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:th.t}}>Extra Monthly Payment</div>
            <div style={{fontSize:12,color:th.t3,marginTop:2}}>On top of all minimums — thrown at the target debt</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <input type="number" value={extraPayment} onChange={e=>setExtraPayment(+e.target.value)} style={{width:100,textAlign:'right',padding:'8px 12px',fontSize:15,fontWeight:700}}/>
            <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,color:th.t3}}>/mo</span>
          </div>
        </div>
        <input type="range" min={0} max={2000} step={25} value={extraPayment} onChange={e=>setExtraPayment(+e.target.value)}
          style={{width:'100%',accentColor:th.acc,height:6,cursor:'pointer'}}/>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:th.t4,fontFamily:"'Plus Jakarta Sans',sans-serif",marginTop:4}}>
          <span>£0</span><span>£500</span><span>£1,000</span><span>£1,500</span><span>£2,000</span>
        </div>
      </div>

      {/* Add debt form */}
      {showAdd&&(
        <div className="card" style={{marginBottom:20,border:`1px solid ${th.acc}44`}}>
          <div className="sl" style={{marginBottom:16}}>New Debt</div>
          <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div><label>Debt Name</label><input placeholder="e.g. Credit Card" value={newDebt.name} onChange={e=>setNewDebt({...newDebt,name:e.target.value})}/></div>
            <div><label>Current Balance (£)</label><input type="number" placeholder="0.00" value={newDebt.balance} onChange={e=>setNewDebt({...newDebt,balance:e.target.value})}/></div>
            <div><label>Minimum Payment (£/mo)</label><input type="number" placeholder="0.00" value={newDebt.minPayment} onChange={e=>setNewDebt({...newDebt,minPayment:e.target.value})}/></div>
            <div><label>Interest Rate (%)</label><input type="number" placeholder="0.0" step="0.1" value={newDebt.interest} onChange={e=>setNewDebt({...newDebt,interest:e.target.value})}/></div>
          </div>
          <div style={{marginBottom:14}}>
            <label>Colour</label>
            <div style={{display:'flex',gap:8}}>
              {COLOURS.map(c=><div key={c} onClick={()=>setNewDebt({...newDebt,colour:c})} style={{width:26,height:26,borderRadius:'50%',background:c,cursor:'pointer',border:newDebt.colour===c?`3px solid ${th.t}`:'3px solid transparent',transition:'all .12s'}}/>)}
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="bout" onClick={()=>setShowAdd(false)} style={{flex:1}}>Cancel</button>
            <button className="btn" onClick={addDebt} style={{flex:2}}>Add Debt</button>
          </div>
        </div>
      )}

      {/* Debt list */}
      {debts.length===0
        ?<div className="card"><EmptyState icon="❄" title="No debts added" sub="Add your debts to see your snowball payoff plan and timeline." action="+ Add Debt" onAction={()=>setShowAdd(true)}/></div>
        :(
          <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:20}}>
            {sorted.map((d,idx)=>{
              const payoff=payoffDates.find(p=>p.id===d.id);
              const monthsToPayoff=payoff?.month||0;
              const yearsTo=Math.floor(monthsToPayoff/12);
              const mosTo=monthsToPayoff%12;
              const pct=Math.max(0,Math.min(100,((totalDebt-d.balance)/totalDebt)*100));
              const isTarget=idx===0;
              return (
                <div key={d.id} className="card" style={{border:isTarget?`1px solid ${d.colour}66`:`1px solid ${th.bd}`}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    {/* Rank badge */}
                    <div style={{width:32,height:32,borderRadius:8,background:isTarget?d.colour:th.s2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:isTarget?'#fff':th.t3,flexShrink:0}}>
                      {idx+1}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                        <div>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                            <div style={{width:10,height:10,borderRadius:3,background:d.colour,flexShrink:0}}/>
                            <input value={d.name} onChange={e=>updateDebt(d.id,'name',e.target.value)} style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:700,color:th.t,background:'transparent',border:'none',outline:'none',padding:0,width:'auto'}}/>
                            {isTarget&&<span style={{fontSize:9,fontWeight:700,color:d.colour,background:d.colour+'22',padding:'2px 7px',borderRadius:4}}>TARGET ❄</span>}
                          </div>
                          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                            <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:26,fontWeight:700,color:th.exp}}>{fmt(d.balance)}</span>
                            <div style={{display:'flex',gap:12,alignItems:'center'}}>
                              <div style={{textAlign:'center'}}>
                                <div className="mono" style={{fontSize:10}}>MIN/MO</div>
                                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:th.t}}>{fmt(d.minPayment)}</div>
                              </div>
                              <div style={{textAlign:'center'}}>
                                <div className="mono" style={{fontSize:10}}>INTEREST</div>
                                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:th.t}}>{d.interest}%</div>
                              </div>
                              <div style={{textAlign:'center'}}>
                                <div className="mono" style={{fontSize:10}}>PAID OFF</div>
                                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:d.colour}}>{yearsTo>0?`${yearsTo}y `:''}{ mosTo>0?`${mosTo}mo`:yearsTo===0?'Soon':''}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button className="delbtn vis" onClick={()=>removeDebt(d.id)} style={{marginTop:4}}>✕</button>
                      </div>
                      <div className="prog" style={{height:8}}>
                        <div className="pfill" style={{width:`${100-(d.balance/Math.max(...debts.map(x=>x.balance)))*100}%`,background:d.colour}}/>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {/* Payoff order summary */}
      {debts.length>1&&(
        <div className="card">
          <div className="sl">Payoff Order ({method==='snowball'?'Snowball — smallest first':'Avalanche — highest interest first'})</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {sorted.map((d,i)=>{
              const payoff=payoffDates.find(p=>p.id===d.id);
              const mo=payoff?.month||0;
              const date=new Date();
              date.setMonth(date.getMonth()+mo);
              return (
                <div key={d.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:th.s2,borderRadius:10}}>
                  <div style={{width:24,height:24,borderRadius:6,background:d.colour,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:600,color:th.t}}>{d.name}</div>
                    <div className="mono" style={{marginTop:1}}>{fmt(d.balance)} · {d.interest}% APR</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,color:d.colour}}>
                      {date.toLocaleString('en-GB',{month:'short',year:'numeric'})}
                    </div>
                    <div className="mono" style={{marginTop:1}}>in {mo} months</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ── Subscriptions ─────────────────────────────────────────────────────────────
function SubsTab() {
  const {th,fmt,fmtS,subs,setSubs}=useCtx();
  const [showAdd,setShowAdd]=useState(false);
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState({name:'',amount:'',cycle:'monthly',category:'Entertainment',colour:'#0066FF',icon:'📦',renewDate:'',active:true});

  const ICONS=['📦','🎬','🎵','☁️','🎮','📰','🏋️','🎨','💼','📱','🛒','🎓','💊','🔐','📺','🎙️'];
  const COLOURS=['#0066FF','#e50914','#1db954','#ff6600','#a855f7','#ec4899','#14b8a6','#f59e0b','#64748b','#ef4444'];
  const CYCLES=['weekly','monthly','yearly'];

  const activeSubs=subs.filter(s=>s.active);
  const inactiveSubs=subs.filter(s=>!s.active);

  const monthlyTotal=activeSubs.reduce((s,sub)=>{
    if(sub.cycle==='monthly') return s+sub.amount;
    if(sub.cycle==='yearly')  return s+sub.amount/12;
    if(sub.cycle==='weekly')  return s+sub.amount*4.33;
    return s;
  },0);
  const yearlyTotal=monthlyTotal*12;

  const toMonthly=sub=>{
    if(sub.cycle==='monthly') return sub.amount;
    if(sub.cycle==='yearly')  return sub.amount/12;
    if(sub.cycle==='weekly')  return sub.amount*4.33;
    return sub.amount;
  };

  const daysUntilRenew=dateStr=>{
    if(!dateStr) return null;
    const diff=Math.ceil((new Date(dateStr)-new Date())/(1000*60*60*24));
    return diff;
  };

  const openAdd=()=>{ setForm({name:'',amount:'',cycle:'monthly',category:'Entertainment',colour:'#0066FF',icon:'📦',renewDate:'',active:true}); setEditId(null); setShowAdd(true); };
  const openEdit=sub=>{ setForm({...sub,amount:String(sub.amount)}); setEditId(sub.id); setShowAdd(true); };

  const save=()=>{
    if(!form.name||!form.amount||isNaN(+form.amount)) return;
    const entry={...form,amount:+form.amount,id:editId||Date.now()};
    if(editId) setSubs(subs.map(s=>s.id===editId?entry:s));
    else setSubs([...subs,entry]);
    setShowAdd(false);
  };

  return (
    <>
      <Hdr title="Subscriptions" sub={`${activeSubs.length} active · ${fmt(monthlyTotal)}/mo`}>
        <button className="btn" onClick={openAdd}>+ Add</button>
      </Hdr>

      {/* Summary */}
      <div className="g3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        {[
          {l:'Monthly Cost',   v:fmt(monthlyTotal),  raw:true},
          {l:'Yearly Cost',    v:fmt(yearlyTotal),   raw:true},
          {l:'Active Subs',    v:activeSubs.length,  raw:true},
        ].map(c=>(
          <div key={c.l} className="card">
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,textTransform:'uppercase',color:th.acc,marginBottom:10}}>{c.l}</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:28,fontWeight:800,color:th.t}}>{c.v}</div>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {showAdd&&(
        <div className="card" style={{marginBottom:20,border:`1px solid ${th.acc}44`}}>
          <div className="sl" style={{marginBottom:16}}>{editId?'Edit Subscription':'New Subscription'}</div>
          <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div><label>Name</label><input placeholder="e.g. Netflix" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
            <div><label>Amount (£)</label><input type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
            <div><label>Billing Cycle</label>
              <select value={form.cycle} onChange={e=>setForm({...form,cycle:e.target.value})}>
                {CYCLES.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div><label>Category</label>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {['Entertainment','Work','Health','News','Gaming','Other'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label>Next Renewal</label><input type="date" value={form.renewDate} onChange={e=>setForm({...form,renewDate:e.target.value})}/></div>
            <div>
              <label>Icon</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {ICONS.map(ic=><button key={ic} onClick={()=>setForm({...form,icon:ic})} style={{width:32,height:32,borderRadius:7,border:`1px solid ${form.icon===ic?th.acc:th.bd2}`,background:form.icon===ic?th.accBg:'transparent',fontSize:15,cursor:'pointer'}}>{ic}</button>)}
              </div>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <label>Colour</label>
            <div style={{display:'flex',gap:8}}>
              {COLOURS.map(c=><div key={c} onClick={()=>setForm({...form,colour:c})} style={{width:26,height:26,borderRadius:'50%',background:c,cursor:'pointer',border:form.colour===c?`3px solid ${th.t}`:'3px solid transparent',transition:'border .12s'}}/>)}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,padding:'10px 14px',background:th.s2,borderRadius:9,border:`1px solid ${th.bd2}`}}>
            <input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})} style={{width:15,height:15,accentColor:th.acc}}/>
            <span style={{fontSize:13,color:th.t2}}>Active subscription</span>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="bout" onClick={()=>setShowAdd(false)} style={{flex:1}}>Cancel</button>
            <button className="btn" onClick={save} style={{flex:2}}>{editId?'Save Changes':'Add Subscription'}</button>
          </div>
        </div>
      )}

      {/* Active subscriptions */}
      {subs.length===0
        ?<div className="card"><EmptyState icon="◉" title="No subscriptions yet" sub="Track your recurring subscriptions to see exactly what you're spending." action="+ Add Subscription" onAction={openAdd}/></div>
        :<>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
            {activeSubs.sort((a,b)=>toMonthly(b)-toMonthly(a)).map(sub=>{
              const days=daysUntilRenew(sub.renewDate);
              const monthly=toMonthly(sub);
              const pct=(monthly/monthlyTotal)*100;
              return (
                <div key={sub.id} className="card" style={{cursor:'default'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:44,height:44,borderRadius:12,background:sub.colour+'22',border:`1px solid ${sub.colour}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{sub.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:700,color:th.t}}>{sub.name}</span>
                        <span style={{fontSize:10,fontWeight:700,color:sub.colour,background:sub.colour+'18',padding:'2px 7px',borderRadius:4}}>{sub.category}</span>
                        {days!==null&&days<=7&&<span style={{fontSize:10,fontWeight:700,color:th.exp,background:th.expBg,padding:'2px 7px',borderRadius:4}}>Renews in {days}d</span>}
                        {days!==null&&days>7&&days<=30&&<span style={{fontSize:10,fontWeight:600,color:th.t3,background:th.s2,border:`1px solid ${th.bd}`,padding:'2px 7px',borderRadius:4}}>Renews in {days}d</span>}
                      </div>
                      <div style={{display:'flex',gap:2,marginBottom:6}}>
                        <div style={{height:4,width:`${pct}%`,background:sub.colour,borderRadius:2,transition:'width .4s ease'}}/>
                        <div style={{height:4,flex:1,background:th.bd2,borderRadius:2}}/>
                      </div>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:th.t3}}>{fmt(sub.amount)}/{sub.cycle} · {fmt(monthly)}/mo equivalent · {pct.toFixed(0)}% of total</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:th.t}}>{fmt(sub.amount)}</div>
                      <div style={{fontSize:11,color:th.t3,marginTop:2}}>/{sub.cycle}</div>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <button className="delbtn vis" onClick={()=>openEdit(sub)} style={{opacity:1,color:th.t3}}>✎</button>
                      <button className="delbtn vis" onClick={()=>setSubs(subs.filter(s=>s.id!==sub.id))}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inactive */}
          {inactiveSubs.length>0&&(
            <div className="card">
              <div className="sl" style={{marginBottom:14}}>Paused / Cancelled ({inactiveSubs.length})</div>
              {inactiveSubs.map(sub=>(
                <div key={sub.id} className="txr" style={{opacity:.5}}>
                  <div style={{width:34,height:34,borderRadius:9,background:th.s2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>{sub.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:th.t}}>{sub.name}</div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:th.t3,marginTop:1}}>{fmt(sub.amount)}/{sub.cycle}</div>
                  </div>
                  <button className="delbtn vis" onClick={()=>setSubs(subs.map(s=>s.id===sub.id?{...s,active:true}:s))} style={{opacity:1,color:th.acc,fontSize:11,fontWeight:700}}>Reactivate</button>
                  <button className="delbtn vis" onClick={()=>setSubs(subs.filter(s=>s.id!==sub.id))}>✕</button>
                </div>
              ))}
            </div>
          )}
        </>
      }
    </>
  );
}

// ── Emergency Fund ─────────────────────────────────────────────────────────────
function EmergencyTab() {
  const {th,fmt,fmtS,tx,efSaved:saved,setEfSaved:setSaved,efExpenses:monthlyExpenses,setEfExpenses:setMonthlyExpenses,efMonths:targetMonths,setEfMonths:setTargetMonths}=useCtx();
  const [addAmount,setAddAmount]=useState('');

  // Auto-calculate monthly expenses from last 3 months if available
  const now=new Date();
  const autoExpenses=Math.round(
    [0,1,2].reduce((s,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      return s+tx.filter(t=>{
        const td=new Date(t.date);
        return t.type==='expense'&&td.getMonth()===d.getMonth()&&td.getFullYear()===d.getFullYear();
      }).reduce((s2,t)=>s2+t.amount,0);
    },0)/3
  );

  const effectiveExpenses=monthlyExpenses||autoExpenses||2000;
  const target=effectiveExpenses*targetMonths;
  const pct=Math.min((saved/target)*100,100);
  const remaining=Math.max(0,target-saved);
  const complete=saved>=target;

  // How many months of expenses covered
  const monthsCovered=effectiveExpenses>0?saved/effectiveExpenses:0;

  // Milestones
  const milestones=[1,2,3,6,9,12];

  const addToFund=()=>{
    const amt=parseFloat(addAmount);
    if(!isNaN(amt)&&amt>0){ setSaved(prev=>prev+amt); setAddAmount(''); }
  };

  return (
    <>
      <Hdr title="Emergency Fund" sub="Your financial safety net"/>

      {/* Main visual */}
      <div className="card" style={{marginBottom:20,textAlign:'center',padding:'36px 26px'}}>
        {/* Big ring */}
        <div style={{position:'relative',width:200,height:200,margin:'0 auto 24px'}}>
          <svg width="200" height="200" style={{transform:'rotate(-90deg)'}}>
            <circle cx="100" cy="100" r="82" fill="none" stroke={th.bd2} strokeWidth="12"/>
            <circle cx="100" cy="100" r="82" fill="none" stroke={complete?th.inc:th.acc} strokeWidth="12"
              strokeDasharray={`${2*Math.PI*82}`}
              strokeDashoffset={`${2*Math.PI*82*(1-pct/100)}`}
              strokeLinecap="round"
              style={{transition:'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)'}}
            />
          </svg>
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center'}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:32,fontWeight:800,color:complete?th.inc:th.t,lineHeight:1}}>{pct.toFixed(0)}%</div>
            <div style={{fontSize:12,color:th.t3,marginTop:4}}>{complete?'Complete! 🎉':'funded'}</div>
          </div>
        </div>

        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:36,fontWeight:800,color:complete?th.inc:th.t,marginBottom:6}}>{fmtS(saved)}</div>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,color:th.t3,marginBottom:20}}>
          of {fmt(target)} target · covers <strong style={{color:th.t}}>{monthsCovered<0.1&&monthsCovered>0?'< 0.1':monthsCovered.toFixed(1)} months</strong> of expenses
        </div>

        {/* Quick add */}
        <div style={{display:'flex',gap:10,maxWidth:320,margin:'0 auto'}}>
          <input type="number" placeholder="Add to fund..." value={addAmount} onChange={e=>setAddAmount(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addToFund()}
            style={{flex:1,padding:'11px 14px',fontSize:14,textAlign:'center'}}/>
          <button className="btn" onClick={addToFund} style={{padding:'11px 20px'}}>Add</button>
        </div>
        {saved>0&&(
          <button onClick={()=>{if(window.confirm('Reset emergency fund to £0?'))setSaved(0);}} style={{marginTop:12,background:'none',border:'none',fontSize:11,color:th.t4,cursor:'pointer',textDecoration:'underline'}}>Reset fund</button>
        )}
      </div>

      {/* Config + milestones */}
      <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
        {/* Settings */}
        <div className="card">
          <div className="sl">Fund Settings</div>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div>
              <label>Monthly Expenses (£)</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input type="number" value={monthlyExpenses||autoExpenses} onChange={e=>setMonthlyExpenses(+e.target.value)} style={{flex:1}}/>
                {autoExpenses>0&&!monthlyExpenses&&(
                  <span style={{fontSize:10,color:th.acc,fontWeight:700,whiteSpace:'nowrap'}}>AUTO</span>
                )}
              </div>
              {autoExpenses>0&&<div style={{fontSize:11,color:th.t3,marginTop:4}}>Auto-calculated from last 3 months: {fmt(autoExpenses)}</div>}
            </div>
            <div>
              <label>Target Months of Cover</label>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}>
                {[1,2,3,6,9,12].map(m=>(
                  <button key={m} onClick={()=>setTargetMonths(m)} style={{padding:'7px 14px',borderRadius:8,border:`1px solid ${targetMonths===m?th.acc:th.bd}`,background:targetMonths===m?th.accBg:'transparent',color:targetMonths===m?th.acc:th.t3,fontSize:12,fontWeight:700,cursor:'pointer',transition:'all .15s'}}>
                    {m}mo
                  </button>
                ))}
              </div>
            </div>
            <div style={{padding:'12px 14px',background:th.s2,borderRadius:10,border:`1px solid ${th.bd2}`}}>
              <div style={{fontSize:12,color:th.t2,lineHeight:1.7}}>
                <strong>Target:</strong> {fmt(target)}<br/>
                <strong>Remaining:</strong> {fmt(remaining)}<br/>
                <strong>Months covered:</strong> {monthsCovered.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="card">
          <div className="sl">Milestones</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {milestones.map(m=>{
              const mTarget=effectiveExpenses*m;
              const mPct=Math.min((saved/mTarget)*100,100);
              const done=saved>=mTarget;
              return (
                <div key={m} style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:28,height:28,borderRadius:7,background:done?th.acc:th.s2,border:`1px solid ${done?th.acc:th.bd2}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>
                    {done?'✓':''}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:12,fontWeight:600,color:done?th.t:th.t2}}>{m} month{m>1?'s':''}</span>
                      <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:done?th.acc:th.t3}}>{fmt(mTarget)}</span>
                    </div>
                    <div className="prog">
                      <div className="pfill" style={{width:`${mPct}%`,background:done?th.acc:th.acc+'66'}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Why it matters */}
      {!complete&&(
        <div className="card" style={{border:`1px solid ${th.acc}22`}}>
          <div className="sl">Why 3–6 Months?</div>
          <div style={{fontSize:13,color:th.t2,lineHeight:1.8}}>
            Financial experts recommend keeping <strong style={{color:th.t}}>3–6 months of expenses</strong> in an accessible savings account. This covers unexpected job loss, medical bills, car repairs, or any emergency without going into debt. Keep it in a <strong style={{color:th.t}}>high-interest easy-access account</strong> — not invested, not in your current account.
          </div>
        </div>
      )}
    </>
  );
}

// ── Bank ──────────────────────────────────────────────────────────────────────
function BankTab() {
  const {th,fmt,tx,setTx}=useCtx();
  const SERVER = 'https://finance-tracker-production-0890.up.railway.app';

  const [status,    setStatus]    = useState(null);  // null | {connected, env}
  const [accounts,  setAccounts]  = useState([]);
  const [bankTx,    setBankTx]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [err,       setErr]       = useState('');
  const [serverOk,  setServerOk]  = useState(null);  // null=checking true/false

  // Auto-categorise TrueLayer transactions by merchant name keywords
  const guessCategory = (desc='') => {
    const d = desc.toLowerCase();
    if(/rent|mortgage|council|utilities|electric|gas|water|broadband|bt |virgin media/.test(d)) return 'Housing';
    if(/tesco|sainsbury|asda|morrisons|waitrose|aldi|lidl|co-op|ocado|deliveroo|uber eat|just eat|gregg|subway|mcdonalds|kfc|pizza|nando/.test(d)) return 'Food';
    if(/tfl|uber|lyft|trainline|national rail|petrol|shell|bp |esso|parking|toll/.test(d)) return 'Transport';
    if(/pharmacy|boots|lloyds pharm|dentist|doctor|gp|hospital|nhs|gym|fitness/.test(d)) return 'Health';
    if(/amazon|ebay|asos|next |primark|topshop|nike|adidas|apple store|currys|argos/.test(d)) return 'Shopping';
    if(/netflix|spotify|disney|apple tv|youtube|prime|cinema|sky |now tv|playstation|xbox|steam/.test(d)) return 'Entertainment';
    if(/salary|wages|payroll|freelance|invoice|payment from/.test(d)) return 'Salary';
    if(/interest|dividend|investment|trading/.test(d)) return 'Investment';
    if(/savings|transfer to savings/.test(d)) return 'Savings';
    return 'Other';
  };

  const tlToAppTx = (tlTx, bankName) => {
    const amount  = tlTx.amount || 0;
    const isIncome = amount > 0;
    const desc    = tlTx.description || tlTx.merchant?.name || '';
    const cat     = isIncome
      ? (/salary|wages|payroll/.test(desc.toLowerCase()) ? 'Salary' : 'Other')
      : guessCategory(desc);
    return {
      id:        `tl_${tlTx.transaction_id}`,
      type:      isIncome ? 'income' : 'expense',
      amount:    Math.abs(amount),
      category:  cat,
      note:      desc,
      date:      (tlTx.timestamp || tlTx.date || '').split('T')[0],
      recurring: false,
      fromBank:  bankName,
    };
  };

  const checkServer = async () => {
    try {
      const r = await fetch(`${SERVER}/api/health`, {signal: AbortSignal.timeout(3000)});
      if(r.ok) { setServerOk(true); checkStatus(); }
      else setServerOk(false);
    } catch { setServerOk(false); }
  };

  const checkStatus = async () => {
    try {
      const r = await fetch(`${SERVER}/api/status`);
      const d = await r.json();
      setStatus(d);
      if(d.connected) loadAccounts();
    } catch(e) { setErr('Could not reach server.'); }
  };

  const loadAccounts = async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch(`${SERVER}/api/summary`);
      const d = await r.json();
      if(d.error) throw new Error(d.error);
      setAccounts(d.results || []);
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };

  const loadTransactions = async () => {
    setLoadingTx(true); setErr('');
    try {
      const r = await fetch(`${SERVER}/api/all-transactions`);
      const d = await r.json();
      if(d.error) throw new Error(d.error);
      setBankTx(d.results || []);
    } catch(e) { setErr(e.message); }
    setLoadingTx(false);
  };

  const connectBank = async () => {
    setErr('');
    try {
      const r = await fetch(`${SERVER}/api/auth-url`);
      const d = await r.json();
      if(d.error) throw new Error(d.error);
      window.location.href = d.url;
    } catch(e) { setErr(e.message); }
  };

  const disconnect = async () => {
    if(!window.confirm('Disconnect bank and remove all imported transactions?')) return;
    await fetch(`${SERVER}/api/disconnect`, {method:'POST'});
    setStatus({connected:false}); setAccounts([]); setBankTx([]);
    setTx(prev=>prev.filter(t=>!t.fromBank));
  };

  const importedIds = new Set(tx.filter(t=>t.fromBank).map(t=>t.id));
  const pendingBankTx = bankTx.filter(t=>!importedIds.has(`tl_${t.transaction_id}`));

  const importOne = (tlTx) => {
    const bankName = accounts[0]?.provider?.display_name || 'Bank';
    setTx(prev=>[...prev, tlToAppTx(tlTx, bankName)]);
  };

  const importAll = () => {
    const bankName = accounts[0]?.provider?.display_name || 'Bank';
    setTx(prev=>[...prev, ...pendingBankTx.map(t=>tlToAppTx(t, bankName))]);
  };

  // Check if redirected back after OAuth
  useEffect(()=>{
    const p = new URLSearchParams(window.location.search);
    if(p.get('bank')==='connected') {
      window.history.replaceState({},'',window.location.pathname);
      checkServer();
    } else {
      checkServer();
    }
  },[]);

  const importedTx = tx.filter(t=>t.fromBank);

  // ── Server not running ──────────────────────────────────────────────────
  if(serverOk === false) return (
    <>
      <Hdr title="Bank Integration" sub="Real Open Banking via TrueLayer"/>
      <div className="card" style={{border:`1px solid ${th.exp}44`}}>
        <div style={{fontSize:20,marginBottom:14}}>⚠️</div>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:700,color:th.t,marginBottom:8}}>Server not running</div>
        <div style={{fontSize:13,color:th.t2,lineHeight:1.8,marginBottom:20}}>
          The backend server needs to be running to connect your bank. Open a second terminal in VS Code and run:
        </div>
        <div style={{background:th.bg,borderRadius:9,padding:'14px 18px',fontSize:12,color:th.acc,marginBottom:20,border:`1px solid ${th.bd}`}}>
          cd server<br/>
          npm install<br/>
          npm start
        </div>
        <div style={{fontSize:13,color:th.t2,lineHeight:1.8,marginBottom:16}}>
          Also make sure you've copied <code style={{background:th.bd2,padding:'1px 6px',borderRadius:4,fontSize:11}}>server/.env.example</code> to <code style={{background:th.bd2,padding:'1px 6px',borderRadius:4,fontSize:11}}>server/.env</code> and filled in your TrueLayer credentials.
        </div>
        <button className="btn" onClick={checkServer}>↻ Try Again</button>
      </div>
    </>
  );

  // ── Loading ─────────────────────────────────────────────────────────────
  if(serverOk === null) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:th.t3,fontSize:13}}>
      Connecting to server...
    </div>
  );

  // ── Connected ───────────────────────────────────────────────────────────
  if(status?.connected) return (
    <>
      <Hdr title="Bank Connected" sub={`Live via TrueLayer · ${status.env === 'sandbox' ? 'Sandbox mode' : 'Live mode'}`}>
        <button onClick={loadAccounts} className="bout" style={{padding:'8px 14px',fontSize:11}}>↻ Refresh</button>
        <button onClick={disconnect} style={{background:'transparent',border:`1px solid ${th.expBg}`,color:th.exp,fontSize:11,fontWeight:700,textTransform:'uppercase',padding:'9px 18px',borderRadius:8,cursor:'pointer'}}>Disconnect</button>
      </Hdr>

      {err&&<div style={{marginBottom:16,padding:'11px 14px',background:th.expBg,borderRadius:9,fontSize:12,color:th.exp}}>{err}</div>}

      {/* Account cards */}
      {loading
        ? <div style={{color:th.t3,fontSize:13,textAlign:'center',padding:'32px 0'}}>Loading accounts...</div>
        : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12,marginBottom:20}}>
            {accounts.map(a=>(
              <div key={a.account_id} className="card">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:th.accBg,border:`1px solid ${th.acc}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:th.acc}}>
                      {(a.provider?.display_name||a.display_name||'B')[0]}
                    </div>
                    <div>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:th.t}}>{a.display_name||a.account_type}</div>
                      <div className="mono" style={{marginTop:1}}>{a.provider?.display_name||''} · {a.account_type}</div>
                    </div>
                  </div>
                  <span style={{fontSize:9,fontWeight:700,background:th.incBg,color:th.inc,padding:'3px 8px',borderRadius:4}}>LIVE</span>
                </div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:24,fontWeight:800,marginBottom:5,color:th.t}}>
                  {a.balance ? fmt(a.balance.current) : '—'}
                </div>
                {a.account_number?.iban && <div className="mono">{a.account_number.iban}</div>}
                {a.account_number?.number && <div className="mono">•••• {a.account_number.number.slice(-4)}</div>}
              </div>
            ))}
          </div>
      }

      {/* Fetch transactions */}
      {bankTx.length === 0 && !loadingTx && (
        <div className="card" style={{marginBottom:16,textAlign:'center',padding:'32px'}}>
          <div style={{fontSize:13,color:th.t2,marginBottom:16}}>Fetch your recent transactions from all connected accounts</div>
          <button className="btn" onClick={loadTransactions}>↓ Fetch Transactions (Last 90 Days)</button>
        </div>
      )}

      {loadingTx && (
        <div className="card" style={{marginBottom:16,textAlign:'center',padding:'32px',color:th.t3,fontSize:13}}>
          Fetching transactions...
        </div>
      )}

      {/* Pending imports */}
      {pendingBankTx.length > 0 && (
        <div className="card" style={{marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div>
              <div className="sl" style={{marginBottom:2}}>Pending Import</div>
              <div style={{fontSize:12,color:th.t3}}>{pendingBankTx.length} transactions ready to import</div>
            </div>
            <button className="btn" style={{padding:'8px 16px',fontSize:11}} onClick={importAll}>↓ Import All</button>
          </div>
          {[true, false].map(isInc=>{
            const group = pendingBankTx.filter(t=>(t.amount||0) > 0 === isInc);
            if(!group.length) return null;
            return (
              <div key={String(isInc)}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,marginTop:isInc?0:14}}>
                  <div style={{height:1,flex:1,background:th.bd2}}/>
                  <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:700,textTransform:'uppercase',color:isInc?th.inc:th.exp}}>{isInc?'Income':'Expenses'}</span>
                  <div style={{height:1,flex:1,background:th.bd2}}/>
                </div>
                {group.map(t=>{
                  const cat=CATS.find(c=>c.name===guessCategory(t.description||t.merchant?.name||''));
                  const isIncome=(t.amount||0)>0;
                  return (
                    <div key={t.transaction_id} className="txr">
                      <div style={{width:34,height:34,borderRadius:9,background:th.s2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{cat?.icon||'📦'}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,color:th.t,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{t.description||t.merchant?.name||'Transaction'}</div>
                        <div className="mono" style={{marginTop:2}}>{t.account_name} · {new Date(t.timestamp||t.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                      </div>
                      <span className="chip" style={{background:isIncome?th.incBg:th.expBg,color:isIncome?th.inc:th.exp}}>{guessCategory(t.description||t.merchant?.name||'')}</span>
                      <span className="mono" style={{fontSize:12,color:isIncome?th.inc:th.exp,minWidth:84,textAlign:'right'}}>{isIncome?'+':''}{fmt(Math.abs(t.amount||0))}</span>
                      <button className="btn" style={{padding:'5px 12px',fontSize:10,flexShrink:0}} onClick={()=>importOne(t)}>Import</button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Already imported */}
      {importedTx.length > 0 && (
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div>
              <div className="sl" style={{marginBottom:2}}>Imported Transactions</div>
              <div style={{fontSize:12,color:th.t3}}>{importedTx.length} in your tracker · fully editable</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,color:th.inc}}>{importedTx.filter(t=>t.type==='income').length} income</span>
              <span style={{color:th.t4}}>·</span>
              <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,color:th.exp}}>{importedTx.filter(t=>t.type==='expense').length} expenses</span>
            </div>
          </div>
          {importedTx.slice().reverse().map(t=>(
            <TxRow key={t.id} t={t} onDel={()=>setTx(tx.filter(x=>x.id!==t.id))}/>
          ))}
        </div>
      )}

      {bankTx.length > 0 && pendingBankTx.length === 0 && importedTx.length > 0 && (
        <div style={{marginTop:14,padding:'11px 14px',background:th.s2,borderRadius:9,fontSize:11,color:th.t3,fontFamily:"'Plus Jakarta Sans',sans-serif",border:`1px solid ${th.bd2}`}}>
          ✓ All fetched transactions have been imported.
        </div>
      )}
    </>
  );

  // ── Not connected ────────────────────────────────────────────────────────
  return (
    <>
      <Hdr title="Bank Integration" sub="Real Open Banking via TrueLayer · FCA regulated · PSD2"/>

      {err && <div style={{marginBottom:16,padding:'11px 14px',background:th.expBg,borderRadius:9,fontSize:12,color:th.exp}}>{err}</div>}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:20}}>
        {[
          {ic:'🔒',t:'Secure OAuth',d:'You log in directly with your bank — we never see your password.'},
          {ic:'👁',t:'Read-only',d:'The connection is read-only. We cannot move or modify your money.'},
          {ic:'⚡',t:'Real data',d:'Live balances and 90 days of real transactions pulled instantly.'},
          {ic:'✏️',t:'Fully editable',d:'Every imported transaction can be edited, recategorised or deleted.'},
          {ic:'🏦',t:'40+ banks',d:'Works with Monzo, Barclays, HSBC, Lloyds, NatWest, Starling & more.'},
          {ic:'🇬🇧',t:'UK regulated',d:'TrueLayer is FCA authorised under Open Banking / PSD2.'},
        ].map(c=>(
          <div key={c.t} className="card">
            <div style={{fontSize:22,marginBottom:10}}>{c.ic}</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,color:th.t,marginBottom:5}}>{c.t}</div>
            <div style={{fontSize:12,color:th.t2,lineHeight:1.6}}>{c.d}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:10}}>
        <button className="btn" onClick={connectBank} style={{flex:1,padding:'13px'}}>🏦 Connect My Bank</button>
        <button className="bout" onClick={checkStatus} style={{padding:'13px 20px',fontSize:11}}>↻ Check Status</button>
      </div>
      <div className="mono" style={{marginTop:12,lineHeight:1.9,fontSize:10}}>
        Open Banking is regulated by the FCA under PSD2. Your credentials never touch this app — auth happens directly with your bank.
      </div>
    </>
  );
}


// ── Settings ──────────────────────────────────────────────────────────────────
function SettingsTab() {
  const {th,isDark,setIsDark,curr,setCurr,rates,currObj,confirmDeletes,setConfirmDeletes,tx,setTx,budg,setBudg,goals,setGoals,cal,setCal,assets,setAssets,liabs,setLiabs,setBDemo,fmt,pin,setPin,setAuthed,user}=useCtx();
  const [importErr,setImportErr]=useState('');
  const [importOk, setImportOk] =useState(false);
  const [newPin,   setNewPin]   =useState('');
  const [pinMsg,   setPinMsg]   =useState('');

  const signOut=async()=>{
    await supabase.auth.signOut();
  };

  const exportData=()=>{
    const backup={tx,budg,goals,cal,assets,liabs,exportedAt:new Date().toISOString(),version:'1'};
    const json=JSON.stringify(backup,null,2);
    Object.assign(document.createElement('a'),{href:'data:application/json;charset=utf-8,'+encodeURIComponent(json),download:`finance-backup-${new Date().toISOString().split('T')[0]}.json`}).click();
  };

  const importData=(e)=>{
    const file=e.target.files[0]; if(!file) return;
    setImportErr('');setImportOk(false);
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try {
        const d=JSON.parse(ev.target.result);
        if(d.tx)     setTx(d.tx);
        if(d.budg)   setBudg(d.budg);
        if(d.goals)  setGoals(d.goals);
        if(d.cal)    setCal(d.cal);
        if(d.assets) setAssets(d.assets);
        if(d.liabs)  setLiabs(d.liabs);
        setImportOk(true);
      } catch { setImportErr('Invalid backup file — could not import.'); }
    };
    reader.readAsText(file);
    e.target.value='';
  };

  const resetAll=async()=>{
    if(!window.confirm('This will permanently delete all your data from the database. Are you sure?')) return;
    if(!window.confirm('Are you really sure? This cannot be undone.')) return;
    const uid=user?.id;
    if(uid){
      await Promise.all(
        ['transactions','budgets','goals','calendar_events','assets','liabilities','debts','subscriptions','settings']
          .map(t=>supabase.from(t).delete().eq('user_id',uid))
      );
    }
    ['ft3_dark','ft3_curr','ft3_confirm','ft3_pin','ft3_bdemo'].forEach(k=>localStorage.removeItem(k));
    alert('All data has been reset.');
    window.location.reload();
  };

  const Row=({label,sub,children})=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 0',borderBottom:`1px solid ${th.bd2}`}}>
      <div>
        <div style={{fontSize:14,fontWeight:500,color:th.t}}>{label}</div>
        {sub&&<div className="mono" style={{marginTop:3,fontSize:10}}>{sub}</div>}
      </div>
      {children}
    </div>
  );

  const Toggle=({on,onChange})=>(
    <div onClick={onChange} style={{width:44,height:24,borderRadius:12,background:on?th.acc:th.bd,cursor:'pointer',position:'relative',transition:'background .2s',flexShrink:0}}>
      <div style={{position:'absolute',top:3,left:on?22:3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px #0004'}}/>
    </div>
  );

  const totalTx=tx.length;
  const totalIncome=tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const totalExpense=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);

  return (
    <>
      <Hdr title="Settings" sub="Preferences & data management"/>

      {/* Appearance */}
      <div className="card" style={{marginBottom:14}}>
        <div className="sl">Appearance</div>
        <Row label="Dark Mode" sub="Switch between dark and light theme">
          <Toggle on={isDark} onChange={()=>setIsDark(d=>!d)}/>
        </Row>
        <Row label="Currency" sub={curr==='GBP'?'Displaying in British Pounds':`1 GBP ≈ ${(rates[curr]||1).toFixed(4)} ${curr} (live rate)`}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,maxWidth:360}}>
            {CURRENCIES.map(c=>(
              <button key={c.code} onClick={()=>setCurr(c.code)} style={{padding:'6px 4px',borderRadius:7,border:`1px solid ${curr===c.code?th.acc:th.bd}`,background:curr===c.code?th.accBg:'transparent',color:curr===c.code?th.acc:th.t3,fontSize:10,fontWeight:700,cursor:'pointer',transition:'all .15s',textAlign:'center'}}>
                {c.flag}<br/>{c.code}
              </button>
            ))}
          </div>
        </Row>
      </div>

      {/* Behaviour */}
      <div className="card" style={{marginBottom:14}}>
        <div className="sl">Behaviour</div>
        <Row label="Confirm before deleting" sub="Show a confirmation prompt when deleting transactions, goals or budgets">
          <Toggle on={confirmDeletes} onChange={()=>setConfirmDeletes(d=>!d)}/>
        </Row>
      </div>

      {/* Security */}
      <div className="card" style={{marginBottom:14}}>
        <div className="sl">Security</div>
        <Row label={pin?'Change PIN':'Set up PIN'} sub={pin?`PIN is active — ${pin.length} digits. Enter a new PIN below to change it.`:'Lock your tracker with a PIN. You\'ll be asked for it each time you open the app.'}>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="password" placeholder="4–6 digits" value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,'').slice(0,6))} style={{width:110,padding:'8px 12px',fontSize:13,textAlign:'center'}}/>
            <button className="btn" style={{padding:'8px 14px',fontSize:11}} onClick={()=>{
              if(newPin.length<4){setPinMsg('PIN must be at least 4 digits');return;}
              setPin(newPin);setNewPin('');setPinMsg('PIN saved ✓');setTimeout(()=>setPinMsg(''),2500);
            }}>Save</button>
          </div>
        </Row>
        {pin&&(
          <Row label="Remove PIN" sub="Disable the lock screen">
            <button onClick={()=>{setPin('');setPinMsg('PIN removed');setTimeout(()=>setPinMsg(''),2000);}} style={{background:'transparent',border:`1px solid ${th.bd}`,color:th.t3,fontSize:11,fontWeight:600,textTransform:'uppercase',padding:'8px 14px',borderRadius:7,cursor:'pointer'}}>Remove</button>
          </Row>
        )}
        {pin&&(
          <Row label="Lock now" sub="Sign out and return to the PIN screen">
            <button onClick={()=>setAuthed(false)} style={{background:th.acc,border:'none',color:'#fff',fontSize:11,fontWeight:700,textTransform:'uppercase',padding:'8px 16px',borderRadius:7,cursor:'pointer'}}>🔒 Lock</button>
          </Row>
        )}
        {pinMsg&&<div style={{marginTop:10,padding:'9px 13px',background:pinMsg.includes('✓')||pinMsg.includes('removed')?th.incBg:th.expBg,borderRadius:8,fontSize:12,color:pinMsg.includes('✓')||pinMsg.includes('removed')?th.inc:th.exp}}>{pinMsg}</div>}
      </div>

      {/* Stats */}
      <div className="card" style={{marginBottom:14}}>
        <div className="sl">Your Data</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:4}}>
          {[
            {l:'Transactions',v:totalTx,c:th.t},
            {l:'Total Income',v:fmt(totalIncome),c:th.inc},
            {l:'Total Expenses',v:fmt(totalExpense),c:th.exp},
            {l:'Goals',v:goals.length,c:th.acc},
            {l:'Budgets',v:budg.length,c:th.t},
            {l:'Calendar Events',v:cal.length,c:th.t},
          ].map(s=>(
            <div key={s.l} style={{padding:'12px 14px',background:th.s2,borderRadius:9,border:`1px solid ${th.bd2}`}}>
              <div className="sl" style={{marginBottom:6,fontSize:9}}>{s.l}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Import / Export */}
      <div className="card" style={{marginBottom:14}}>
        <div className="sl">Backup & Restore</div>
        <Row label="Export backup" sub="Download all your data as a JSON file">
          <button className="btn" style={{padding:'8px 18px',fontSize:11}} onClick={exportData}>↓ Export</button>
        </Row>
        <Row label="Import backup" sub="Restore from a previously exported JSON file">
          <label style={{margin:0,cursor:'pointer'}}>
            <span className="bout" style={{padding:'8px 18px',fontSize:11,display:'inline-block',cursor:'pointer'}}>↑ Import</span>
            <input type="file" accept=".json" onChange={importData} style={{display:'none'}}/>
          </label>
        </Row>
        {importOk&&<div style={{marginTop:10,padding:'10px 14px',background:th.incBg,borderRadius:8,fontSize:12,color:th.inc}}>✓ Backup imported successfully</div>}
        {importErr&&<div style={{marginTop:10,padding:'10px 14px',background:th.expBg,borderRadius:8,fontSize:12,color:th.exp}}>{importErr}</div>}
      </div>

      {/* Account */}
      <div className="card" style={{marginBottom:18}}>
        <div className="sl">Account</div>
        <Row label="Signed in as" sub={user?.email||'Unknown'}>
          <button onClick={signOut} style={{background:'transparent',border:`1px solid ${th.bd}`,color:th.t3,fontSize:11,fontWeight:700,textTransform:'uppercase',padding:'8px 16px',borderRadius:7,cursor:'pointer',transition:'all .15s'}}>Sign Out</button>
        </Row>
      </div>

      {/* Danger zone */}
      <div className="card" style={{border:`1px solid ${th.exp}22`}}>
        <div className="sl" style={{color:th.exp}}>Danger Zone</div>
        <Row label="Disconnect bank demo" sub="Remove all imported bank transactions and reset the connection">
          <button onClick={()=>{setBDemo(false);setTx(tx.filter(t=>!t.fromBank));}} style={{background:'transparent',border:`1px solid ${th.bd}`,color:th.t3,fontSize:11,fontWeight:600,textTransform:'uppercase',padding:'8px 16px',borderRadius:7,cursor:'pointer'}}>Disconnect</button>
        </Row>
        <Row label="Reset all data" sub="Permanently delete all transactions, goals, budgets and settings">
          <button onClick={resetAll} style={{background:'transparent',border:`1px solid ${th.exp}`,color:th.exp,fontSize:11,fontWeight:700,textTransform:'uppercase',padding:'8px 16px',borderRadius:7,cursor:'pointer',transition:'all .15s'}}>Reset Everything</button>
        </Row>
      </div>
    </>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────
function TxModal({onClose}) {
  const {th,tx,setTx,editTx,budg}=useCtx();
  const isEdit=!!(editTx?.id);
  const [type,setType]=useState(editTx?.type||'expense');
  const [amount,setAmount]=useState(editTx?.amount?.toString()||'');
  const [cat,setCat]=useState(editTx?.category||(editTx?.type==='income'?'Salary':'Food'));
  const [note,setNote]=useState(editTx?.note||'');
  const [date,setDate]=useState(editTx?.date||new Date().toISOString().split('T')[0]);
  const [recur,setRecur]=useState(editTx?.recurring||false);

  // Merge default CATS with any custom budget categories
  const defaultCatNames=CATS.map(c=>c.name);
  const customCats=budg.map(b=>b.category).filter(c=>!defaultCatNames.includes(c));
  const expenseCats=[...CATS.map(c=>c.name),...customCats];

  const save=()=>{
    if(!amount||isNaN(+amount)||+amount<=0) return;
    const entry={id:editTx?.id||Date.now(),type,amount:+amount,category:cat,note,date,recurring:recur};
    if(isEdit) setTx(tx.map(t=>t.id===editTx.id?entry:t));
    else setTx([...tx,entry]);
    onClose();
  };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:24,color:th.t}}>
          {isEdit?'Edit Transaction':'New Transaction'}
        </div>
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {['income','expense'].map(t=>(
            <button key={t} onClick={()=>{setType(t);if(!isEdit)setCat(t==='income'?'Salary':'Food');}} style={{flex:1,padding:'10px',border:`1px solid ${type===t?(t==='income'?th.inc+'55':th.exp+'55'):th.bd2}`,borderRadius:9,background:type===t?(t==='income'?th.incBg:th.expBg):'transparent',color:type===t?(t==='income'?th.inc:th.exp):th.t3,cursor:'pointer',fontSize:11,fontWeight:700,textTransform:'uppercase',transition:'all .15s'}}>
              {t}
            </button>
          ))}
        </div>
        <div style={{display:'grid',gap:14}}>
          <div><label>Amount (£)</label><input type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
          <div><label>Category</label>
            <select value={cat} onChange={e=>setCat(e.target.value)}>
              {(type==='income'?ICATS:expenseCats).map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label>Note</label><input type="text" placeholder="Optional description..." value={note} onChange={e=>setNote(e.target.value)}/></div>
          <div><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:th.s2,borderRadius:9,border:`1px solid ${th.bd2}`}}>
            <input type="checkbox" id="rec" checked={recur} onChange={e=>setRecur(e.target.checked)} style={{width:15,height:15,accentColor:th.acc}}/>
            <label htmlFor="rec" style={{margin:0,cursor:'pointer',textTransform:'none',letterSpacing:0,fontSize:13,color:th.t2}}>Recurring monthly — show on dashboard for quick-add</label>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:24}}>
          <button className="bout" onClick={onClose} style={{flex:1}}>Cancel</button>
          <button className="btn" onClick={save} style={{flex:2}}>{isEdit?'Save Changes':'Save Transaction'}</button>
        </div>
      </div>
    </div>
  );
}

function GoalModal({onClose}) {
  const {th,goals,setGoals}=useCtx();
  const [name,setName]=useState('');
  const [target,setTarget]=useState('');
  const [saved,setSaved]=useState('');
  const [deadline,setDeadline]=useState('');
  const [icon,setIcon]=useState('🎯');
  const icons=['🎯','✈️','🏠','🚗','💻','🛡️','💍','🎓','🏖️','📱','🎸','🎮','🐕','👶','🌏'];
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:24,color:th.t}}>New Goal</div>
        <div style={{display:'grid',gap:14}}>
          <div><label>Icon</label><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{icons.map(i=><button key={i} onClick={()=>setIcon(i)} style={{width:36,height:36,borderRadius:8,border:`1px solid ${icon===i?th.t:th.bd2}`,background:icon===i?th.s2:'transparent',fontSize:16,cursor:'pointer',transition:'all .12s'}}>{i}</button>)}</div></div>
          <div><label>Name</label><input type="text" placeholder="e.g. Holiday Fund" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div><label>Target (£)</label><input type="number" placeholder="0.00" value={target} onChange={e=>setTarget(e.target.value)}/></div>
          <div><label>Already saved (£)</label><input type="number" placeholder="0.00" value={saved} onChange={e=>setSaved(e.target.value)}/></div>
          <div><label>Deadline (optional)</label><input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}/></div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:24}}>
          <button className="bout" onClick={onClose} style={{flex:1}}>Cancel</button>
          <button className="btn" onClick={()=>{if(!name||!target||isNaN(+target)||+target<=0)return;setGoals([...goals,{id:Date.now(),name,target:+target,saved:+saved||0,icon,deadline}]);onClose();}} style={{flex:2}}>Create Goal</button>
        </div>
      </div>
    </div>
  );
}

function EventModal({onClose}) {
  const {th,cal,setCal}=useCtx();
  const [title,setTitle]=useState('');
  const [date,setDate]=useState(new Date().toISOString().split('T')[0]);
  const [type,setType]=useState('bill');
  const [amount,setAmount]=useState('');
  const [recur,setRecur]=useState(false);
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:24,color:th.t}}>New Calendar Event</div>
        <div style={{display:'grid',gap:14}}>
          <div><label>Title</label><input type="text" placeholder="e.g. Monthly Salary" value={title} onChange={e=>setTitle(e.target.value)}/></div>
          <div><label>Type</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {Object.entries(EVT).map(([k,v])=>(
                <button key={k} onClick={()=>setType(k)} style={{padding:'9px 10px',border:`1px solid ${type===k?v.color+'55':th.bd2}`,borderRadius:9,background:type===k?v.bg:'transparent',color:type===k?v.color:th.t3,cursor:'pointer',fontSize:10,fontWeight:700,textTransform:'uppercase',transition:'all .12s'}}>{v.label}</button>
              ))}
            </div>
          </div>
          <div><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
          <div><label>Amount £ (optional)</label><input type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <input type="checkbox" id="erec" checked={recur} onChange={e=>setRecur(e.target.checked)} style={{width:15,height:15,accentColor:th.t}}/>
            <label htmlFor="erec" style={{margin:0,cursor:'pointer',textTransform:'none',letterSpacing:0,fontSize:13,color:th.t2}}>Recurring monthly</label>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:24}}>
          <button className="bout" onClick={onClose} style={{flex:1}}>Cancel</button>
          <button className="btn" onClick={()=>{if(!title||!date)return;setCal([...cal,{id:Date.now(),title,date,type,amount:amount?+amount:null,recurring:recur}]);onClose();}} style={{flex:2}}>Save Event</button>
        </div>
      </div>
    </div>
  );
}

function AssetModal({type,onClose}) {
  const {th,assets,setAssets,liabs,setLiabs}=useCtx();
  const isAsset=type==='asset';
  const [name,setName]=useState('');
  const [atype,setAtype]=useState(isAsset?'Bank Account':'Student Loan');
  const [value,setValue]=useState('');
  const types=isAsset?['Bank Account','Property','Investment','Pension','Vehicle','Other']:['Mortgage','Student Loan','Personal Loan','Credit Card','Other'];
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:24,color:th.t}}>Add {isAsset?'Asset':'Liability'}</div>
        <div style={{display:'grid',gap:14}}>
          <div><label>Name</label><input type="text" placeholder={isAsset?'e.g. Monzo Savings':'e.g. Student Loan'} value={name} onChange={e=>setName(e.target.value)}/></div>
          <div><label>Type</label>
            <select value={atype} onChange={e=>setAtype(e.target.value)}>
              {types.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label>{isAsset?'Current Value':'Amount Owed'} (£)</label><input type="number" placeholder="0.00" value={value} onChange={e=>setValue(e.target.value)}/></div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:24}}>
          <button className="bout" onClick={onClose} style={{flex:1}}>Cancel</button>
          <button className="btn" onClick={()=>{
            if(!name||!value||isNaN(+value)||+value<=0) return;
            const item={id:Date.now(),name,type:atype,value:+value};
            if(isAsset) setAssets([...assets,item]); else setLiabs([...liabs,item]);
            onClose();
          }} style={{flex:2}}>Add {isAsset?'Asset':'Liability'}</button>
        </div>
      </div>
    </div>
  );
}

function BudgetModal({onClose}) {
  const {th,budg,setBudg}=useCtx();
  const [name,setName]=useState('');
  const [limit,setLimit]=useState('');
  const [icon,setIcon]=useState('📦');
  const [colour,setColour]=useState('#0066FF');

  const ICONS=['📦','🏠','🍽️','🚗','💊','🛍️','🎭','💰','✈️','🎓','🐕','👶','💇','🏋️','🎮','🍺','☕','🐈','🌿','🎵','💡','🧾','🎁','🏥','⚽'];
  const COLOURS=['#0066FF','#00FF88','#FF3D3D','#f59e0b','#a855f7','#ec4899','#14b8a6','#f97316','#64748b','#84cc16'];

  const existing=budg.map(b=>b.category.toLowerCase());

  const save=()=>{
    const trimmed=name.trim();
    if(!trimmed||!limit||isNaN(+limit)||+limit<=0) return;
    if(existing.includes(trimmed.toLowerCase())){alert('A budget for that category already exists.');return;}
    setBudg([...budg,{category:trimmed,limit:+limit,icon,colour}]);
    onClose();
  };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:24,color:th.t}}>New Budget Category</div>
        <div style={{display:'grid',gap:16}}>

          <div>
            <label>Icon</label>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {ICONS.map(ic=>(
                <button key={ic} onClick={()=>setIcon(ic)} style={{width:36,height:36,borderRadius:8,border:`1px solid ${icon===ic?th.acc:th.bd2}`,background:icon===ic?th.accBg:'transparent',fontSize:16,cursor:'pointer',transition:'all .12s'}}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label>Colour</label>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {COLOURS.map(c=>(
                <button key={c} onClick={()=>setColour(c)} style={{width:28,height:28,borderRadius:'50%',background:c,border:colour===c?`3px solid ${th.t}`:'3px solid transparent',cursor:'pointer',transition:'all .12s'}}/>
              ))}
            </div>
          </div>

          <div>
            <label>Category Name</label>
            <input type="text" placeholder="e.g. Gym, Pets, Kids..." value={name} onChange={e=>setName(e.target.value)}/>
          </div>

          <div>
            <label>Monthly Limit (£)</label>
            <input type="number" placeholder="0.00" value={limit} onChange={e=>setLimit(e.target.value)}/>
          </div>

          {name&&limit&&(
            <div style={{padding:'12px 14px',background:th.s2,borderRadius:10,border:`1px solid ${th.bd2}`,display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:9,background:colour+'18',border:`1px solid ${colour}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>{icon}</div>
              <div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:th.t}}>{name||'Preview'}</div>
                <div className="mono" style={{marginTop:1}}>Limit £{(+limit||0).toFixed(2)}/mo</div>
              </div>
              <div style={{marginLeft:'auto',width:40,height:4,borderRadius:2,background:colour,opacity:.8}}/>
            </div>
          )}
        </div>

        <div style={{display:'flex',gap:10,marginTop:24}}>
          <button className="bout" onClick={onClose} style={{flex:1}}>Cancel</button>
          <button className="btn" onClick={save} style={{flex:2}}>Add Budget</button>
        </div>
      </div>
    </div>
  );
}
