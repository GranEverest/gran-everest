// web/app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ===== Boot de tema igual a Hostinger (usa localStorage 'geTheme' y data-theme en <html>) =====
function useThemeBoot() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("geTheme");
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      const isDark = saved ? saved === "dark" : !!prefersDark;
      setDark(isDark);
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
      localStorage.setItem("geTheme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);
  return { dark, setDark };
}

// ===== Montaña ASCII (exacta como en Hostinger) =====
const MOUNTAIN_ASCII = String.raw`
             +           
                        =+                        
                                                                                   ===-                                                                                   
                                                                                  =+=----                                                                                 
                                                                                +++++---=--                                                                               
                                                                               ++**++--=-=-=                                                                              
                                                                             ++++++*=---==-=-                                                                             
                                                                            +++++***+--------=-                                                                           
                                                                          +++++******=---------=                                                                          
                                                                         ++++++******+=----------                                                                         
                                                                        ++*+++*+******=--------=--=                                                                       
                                                                      +++++**********+-----==------=                                                                      
                                                                     ++**+********++=-=----------------                                                                   
                                                                   =++**+*****+**+=---==------==-------=                                                                  
                                                                 =++++*#***********---=-==-----==------=-=                                                                
                                                                ++++*****++*#+***#**=-----=---=--===----=--                                                               
                                                               ++**+*+++******####*++=-----=-----=-==------=                                                              
                                                              ++*#**++**+*######*+--===-----=------===-------                                                             
                                                            =++***++*############=---===-----==---=-===--=--==                                                            
                                                          ++++***+######**#+###**=----=-=-----===----===--==---=                                                          
                                                         ++*+****######**+*##**###+-----==------==-----==--=-=----                                                         
                                                    +++++++*#*+#######*++###**#####*--------------++-----======+=----=                                                    
                                                 +++++++*++**+#######+**###*+#*######*=----------=-=+--==--=-===+=--=+=-=-                                                
                                                +#++++**+++++*###*##+#####***###########-----------===---=---====++++++---==                                              
                                              ++**#+=++=++++#**##**+####*#**#############=---------===+---=-====+*+++++=-----                                            
                                            ++*#******+++++**#*#+++#####*+#####*###########+--------===+=-----=++++++++==-----=                                          
                                           ***++#####*##**+*++*++####*#***######*##*########--------=-====-----=+++=++#+++=----=                                         
                                          ++++**########++++++*####***+**####*##############=---=-------===------==+++**+++++-----                                        
                                      +++*+++++###++##*++=+++#####*##+*###*###*##*##########+---==+++=---==-------=+++++++++=+=--===                                     
                                    *#*=-==+++=+++*+=++==+++#####+*++*#####*+*########%##%#++----=++*=-----=--------=+*+++++=++=---==-                                    
                                   *###+-----==+++++====+**####+*++++*#++#++++######%##==---=------=+++=-----==-=----=+++=+++++++----=-=                                  
                                 ######++=---------==++++++**++**+*+**+++++**########*##------------=++===------=---=--=++==+=++===--=+=--                                 
                               +######***#+---=+=--=--====+++++++*+**+++++*#########++###=----------===++=-----------===-====+=+++=-----====                              
                             +##########*+++*+==++--===--==++**++++++++++######*++==++*+--+-------===-=++++===--------==+=-=+==++=++------==-=                            
                           *##*##########**+##+-++++----=---===+++++++*########+-----------+*=---=-=++=-+++*+*+=-----=--==+===*+=+++++---------                           
                          ################**###*=-=+++==-===---=++++*###########+-----------=+*+-----==++=++*+++=---------=+=--=+++=++++----==---=                        
                        *#######*#########*+*###*=--==++=+-==+==+++++++**########+----=----==-+**+=--=--++****#***+---------===-==+++=+++=--====-==                       
                       *####*+*#####*+#####+=+####+=--==++++==+*+++++=++###########=--+++----=++##*+--+===+##**####*#*#=--------=--=+++=+++---======                      
                      ###############++###*#+++###++++=-==++*++++==+###########%#%##%+-++**+==-=++###+=+#++++*#####*###**#=--===-----=-++++++--==++==                     
                    #####**###########*++#####++*###++*#*+===+==*##########%#%%##%#####+=+=##+=++=+####++*###**##*###*##*#***==+++=------=++++==+=====                    
                   *#########%#########**################+#*++##%#################%############***####*##++*#######*##########*==++++==+==*#*##*+=+++==+                  
                 #*#######################+#################%%##############%%#%%##%##%##########*###*###++##*#########*#####**##++***###**+#***#++++++++                 
                #############%#%#%#%##%##########*###########%%%%%%#%#%##%%%##%%%##%##############*##*#########*#########**######%#*+###*##%#*#+###*#*##*+                
              *#######%#%##%%##%%#%#%%#%#######%#%#%###%#%%%#%%#%#%#%%%%#%#%%#%%#%%%%#%##%#%###%######*#################%#######%#############%############*              
 +#######*##########*###############################*############################################*###*######*###############*#*###############*##+  
`;

// ===== Componente =====
export default function Home() {
  const { dark, setDark } = useThemeBoot();

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <Link className="brand" href="/">GranEverest</Link>
        <Link className="pill" href="/borrow">Launch app</Link>
        <button
          id="themeToggle"
          className="pill"
          type="button"
          onClick={() => setDark((v) => !v)}
        >
          {dark ? "Light" : "Dark"}
        </button>
      </nav>

      {/* MAIN */}
      <main className="wrap">
        {/* Montaña */}
        <section className="ge-mountain-wrap center" aria-hidden="true">
          <pre className="ge-mountain">{MOUNTAIN_ASCII}</pre>
        </section>

        <h1 className="center">Borrow at 0% Interest in ETH</h1>
        <p className="center small" style={{ maxWidth: 780, margin: "0 auto" }}>
          Borrow <b>ETH</b>. Collateral in <b>ETH</b>. Debt in <b>ETH</b>. On Base (Ethereum L2).
          Non-custodial. Open architecture. No liquidation risk by design: we guide LTV and withdrawals to keep you safe.
        </p>

        <p className="center" style={{ marginTop: 12 }}>
          <Link href="/borrow" className="pill">Launch app</Link>
          <a href="#features" className="pill" style={{ marginLeft: 8 }}>Learn more</a>
        </p>

        {/* Features */}
        <section id="features" className="features">
          <article className="feature">
            <h3>0% interest (ETH)</h3>
            <p className="small">No interest on collateral or debt. No ongoing protocol fee. Only network gas.</p>
          </article>
          <article className="feature">
            <h3>No liquidation risk</h3>
            <p className="small">Clear LTV guidance and “repay to withdraw” rules keep your position within safe bounds.</p>
          </article>
          <article className="feature">
            <h3>Transparent costs</h3>
            <p className="small">Protocol fee <b>0.25%</b> only on deposit &amp; withdrawal. Borrow/repay have no protocol fee.</p>
          </article>
        </section>

        {/* How it works */}
        <section id="how" style={{ marginTop: 34 }}>
          <h2>How it works</h2>
          <ol className="small">
            <li><b>Deposit ETH.</b> It stays on-chain and defines your borrow limit (70% LTV).</li>
            <li><b>Borrow ETH at 0%.</b> Your debt unit is ETH. No interest. No ongoing protocol fee.</li>
            <li><b>Repay to withdraw.</b> Withdraw collateral after repaying enough to keep LTV ≤ 70%.</li>
            <li><b>UI guard.</b> The app explains why re-depositing borrowed ETH doesn’t give extra cash.</li>
          </ol>
        </section>

        {/* FAQ */}
        <section id="faq" style={{ marginTop: 28 }}>
          <h2>FAQ</h2>
          <details className="feature" style={{ marginTop: 10 }}>
            <summary>Why can’t I loop borrowed ETH for more cash?</summary>
            <p className="small">The UI guard blocks deposit+borrow same-block loops and explains required repay amounts.</p>
          </details>
          <details className="feature" style={{ marginTop: 10 }}>
            <summary>What fees apply?</summary>
            <p className="small">Only 0.25% on deposit/withdraw. Borrow &amp; repay have no protocol fee. Users pay gas.</p>
          </details>
          <p className="center" style={{ marginTop: 18 }}>
            <Link href="/borrow" className="pill">Launch app</Link>
          </p>
        </section>
      </main>

      <div className="footer">© {new Date().getFullYear()} GranEverest · Base</div>

      {/* ===== Estilos globales: idénticos a Hostinger ===== */}
      <style jsx global>{`
        :root{
          --bg:#0f0f0f; --text:#e7e7e7; --muted:#bdbdbd;
          --card:#111; --border:#222;
          --btn-bg:#ffffff; --btn-fg:#111;
          --brand:var(--text); --link:var(--text);
          --mountain:#d6d6d6;
        }
        html[data-theme="light"]{
          --bg:#ffffff; --text:#111; --muted:#666;
          --card:#fafafa; --border:#e5e5e5;
          --btn-bg:#ffffff; --btn-fg:#111;
          --brand:#111; --link:#111;
          --mountain:#333;
        }
        html,body{
          margin:0; padding:0; background:var(--bg); color:var(--text);
          font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
        }
        a{ color:var(--link); text-decoration:none; }
        h1,h2,h3{ margin:.75rem 0; }
        .wrap{ max-width:980px; margin:0 auto; padding:16px 20px 96px; }

        .nav{
          position:sticky; top:0; z-index:2; display:flex; gap:10px;
          align-items:center; justify-content:flex-end; padding:12px 16px; background:var(--bg);
        }
        .brand{ margin-right:auto; color:var(--brand)!important; font-weight:600; }
        .pill{
          display:inline-flex; align-items:center; justify-content:center;
          padding:6px 12px; border-radius:12px; border:1px solid var(--border);
          background:var(--btn-bg); color:var(--btn-fg)!important; font-size:14px; line-height:1; cursor:pointer;
        }

        .center{text-align:center;}

        /* Montaña */
        .ge-mountain-wrap{
          max-width:1100px; margin:1.6rem auto .75rem; text-align:center;
          overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch;
        }
        .ge-mountain-wrap::-webkit-scrollbar{ display:none; width:0; height:0; }
        .ge-mountain{
          font-family:ui-monospace,Consolas,Menlo,Monaco,monospace;
          display:inline-block; white-space:pre;
          font-size:clamp(2.6px,0.65vw,8px); line-height:.68em; letter-spacing:.28px;
          color:var(--mountain); opacity:.95;
        }
        @media (max-width:360px){
          .ge-mountain{ font-size:2.4px; letter-spacing:.22px; }
        }

        .features{
          display:grid; grid-template-columns:repeat(3,1fr); gap:22px; margin-top:26px;
        }
        .feature{ background:var(--card); border:1px solid var(--border); border-radius:12px; padding:14px; }
        .small{ color:var(--muted); font-size:13px; }

        .footer{
          position:fixed; left:50%; transform:translateX(-50%); bottom:8px;
          color:var(--muted); font-size:13px; pointer-events:none;
        }
      `}</style>
    </>
  );
}
