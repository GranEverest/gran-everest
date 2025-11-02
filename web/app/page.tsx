"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ====== LOGO ASCII (mismo arte) ======
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
             +######*##########*###############################*############################################*###*######*###############*#*###############*##+             
`;

export default function Home() {
  // Theme toggle (persists on landing)
  const [dark, setDark] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem("GE:theme");
    if (saved === "light") setDark(false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("GE:theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.25rem",
          zIndex: 20,
          background: "var(--bg)",
        }}
      >
        <span className="ge-logo">GranEverest</span>

        <nav style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a className="ge-btn small" href="#features">Features</a>
          <a className="ge-btn small" href="#how">How it works</a>
          <a className="ge-btn small" href="#faq">FAQ</a>

          <Link href="/borrow" className="ge-btn">Launch app</Link>

          <button
            onClick={() => setDark((v) => !v)}
            className="ge-btn"
            style={{ width: 120, justifyContent: "flex-start" }}
            aria-label="Toggle theme"
          >
            <span className="ge-dot" />
            {dark ? "Light" : "Dark"}
          </button>
        </nav>
      </header>

      <main
        style={{
          minHeight: "calc(100svh - 60px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1.2rem",
          color: "var(--fg)",
          background: "var(--bg)",
        }}
      >
        {/* ── Monte (nuevo wrapper sin scrollbar y “poquitito” más chico) ── */}
        <section className="ge-mountain-wrap">
          <pre className="ge-mountain" aria-hidden="true">{MOUNTAIN_ASCII}</pre>
        </section>

        {/* Hero */}
        <section
          style={{
            textAlign: "center",
            marginTop: "0.5rem",
            maxWidth: 900,
          }}
        >
          <h1 style={{ fontSize: "2.4rem", margin: "0.2rem 0 0.6rem" }}>
            Borrow at 0% Interest in ETH
          </h1>
          <p style={{ opacity: 0.9, lineHeight: 1.5, marginBottom: 16 }}>
            Borrow ETH. Collateral in <b>ETH</b>. Debt in <b>ETH</b>. On Base (Ethereum L2).
            Non-custodial. Open architecture. No liquidation risk by design: we guide LTV and withdrawals to keep you safe.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link href="/borrow" className="ge-btn">Launch app</Link>
            <a href="#features" className="ge-btn ge-rect">Learn more</a>
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ marginTop: 36, width: "100%", maxWidth: 1100 }}>
          <h2 style={{ marginBottom: 12 }}>Features</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            <article className="ge-rect" style={{ background: "var(--panel)", padding: 14 }}>
              <h3 style={{ marginTop: 0 }}>0% interest (ETH)</h3>
              <p style={{ opacity: 0.9 }}>
                No interest on collateral or debt. No ongoing protocol fee. Only network gas.
              </p>
            </article>

            <article className="ge-rect" style={{ background: "var(--panel)", padding: 14 }}>
              <h3 style={{ marginTop: 0 }}>No liquidation risk</h3>
              <p style={{ opacity: 0.9 }}>
                Clear LTV guidance and “repay to withdraw” rules keep your position within safe bounds.
              </p>
            </article>

            <article className="ge-rect" style={{ background: "var(--panel)", padding: 14 }}>
              <h3 style={{ marginTop: 0 }}>Transparent costs</h3>
              <p style={{ opacity: 0.9 }}>
                Protocol fee <b>0.25%</b> only on <b>deposit</b> and <b>withdrawal</b>. Borrow/repay have no protocol fee.
              </p>
            </article>
          </div>
        </section>

        {/* How it works */}
        <section id="how" style={{ marginTop: 36, width: "100%", maxWidth: 900 }}>
          <h2>How it works</h2>
          <ol style={{ lineHeight: 1.6, paddingLeft: 18 }}>
            <li><b>Deposit ETH</b>. It stays on-chain and defines your borrow limit (70% LTV).</li>
            <li><b>Borrow ETH at 0%</b>. Your debt unit is ETH. No interest. No ongoing protocol fee.</li>
            <li><b>Repay to withdraw</b>. To withdraw collateral, first repay enough to keep LTV ≤ 70%.</li>
            <li><b>UI guard</b>. If you have debt, the app explains why re-depositing borrowed ETH doesn’t give extra cash.</li>
          </ol>
        </section>

        {/* FAQ */}
        <section id="faq" style={{ marginTop: 36, width: "100%", maxWidth: 900 }}>
          <h2>FAQ</h2>
          <details className="ge-rect" style={{ background: "var(--panel)", padding: 12, marginBottom: 10 }}>
            <summary><b>Why can’t I loop borrowed ETH for more cash?</b></summary>
            <p style={{ marginTop: 8, opacity: 0.9 }}>
              Because with 70% LTV, re-depositing what you borrowed only lets you borrow 70% of that again, leaving you with less net liquidity and a larger repayment.
              The UI warns you and lets you continue only if you bring <i>new</i> funds.
            </p>
          </details>
          <details className="ge-rect" style={{ background: "var(--panel)", padding: 12, marginBottom: 10 }}>
            <summary><b>What fees apply?</b></summary>
            <p style={{ marginTop: 8, opacity: 0.9 }}>
              A 0.25% protocol fee applies on deposits and withdrawals. Borrow and repay have no protocol fee. Users pay their own L2 gas.
            </p>
          </details>
        </section>

        {/* CTA */}
        <section style={{ marginTop: 36, textAlign: "center" }}>
          <Link href="/borrow" className="ge-btn" style={{ fontSize: "1rem" }}>
            Launch app
          </Link>
        </section>
      </main>

      <footer className="ge-page-footer">© {new Date().getFullYear()} GranEverest · Base</footer>
    </>
  );
}
