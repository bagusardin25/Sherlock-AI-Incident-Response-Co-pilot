export default function DocsPage() {
  return (
    <article className="markdown-content max-w-4xl">
      <section id="introduction" className="scroll-mt-32">
        <h1 className="text-4xl lg:text-5xl tracking-tight !mb-6">Sherlock Documentation</h1>
        <p className="text-lg text-slate-300 leading-relaxed mb-6">
          Welcome to the official documentation for <strong>Sherlock</strong>. Sherlock is an AI Incident Response Co-pilot designed to resolve production incidents from alert to pull request in minutes.
        </p>
        <p className="text-slate-300">
          By leveraging specialized AI agents and deep codebase context, Sherlock minimizes downtime, automatically diagnoses root causes, and generates postmortems for your team, allowing your engineers to focus on building features rather than putting out fires.
        </p>
      </section>

      <hr className="my-12 border-slate-800" />

      <section id="quickstart" className="scroll-mt-32">
        <h2 className="text-3xl tracking-tight !mb-8">Quickstart</h2>
        
        <h3 className="text-xl font-semibold !mt-8 !mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">1</span> 
          Submit an Alert
        </h3>
        <p className="text-slate-300">
          Go to the main dashboard and paste your stack trace, error log, or system alert directly into the investigation input field. The more context you provide in the error log, the better Sherlock can analyze the issue.
        </p>
        
        <h3 className="text-xl font-semibold !mt-8 !mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">2</span> 
          Provide Repository Context
        </h3>
        <p className="text-slate-300">
          Provide the URL to your code repository (e.g., GitHub link). Sherlock needs this to deeply understand the architecture of your application and pinpoint the exact file causing the issue.
        </p>
        
        <h3 className="text-xl font-semibold !mt-8 !mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">3</span> 
          Let the Agents Work
        </h3>
        <p className="text-slate-300 mb-4">
          Once submitted, Sherlock kicks off a multi-agent pipeline working in parallel and sequentially where necessary:
        </p>
        <ul className="space-y-2 text-slate-300 ml-4">
          <li><strong className="text-foreground">Triage Agent:</strong> Assesses severity and routes the incident.</li>
          <li><strong className="text-foreground">Forensics Agent:</strong> Searches codebases and recent commits for suspects.</li>
          <li><strong className="text-foreground">Analyst Agent:</strong> Determines the root cause.</li>
          <li><strong className="text-foreground">Fix Agent:</strong> Writes the actual code fix and creates a PR.</li>
          <li><strong className="text-foreground">Postmortem Agent:</strong> Summarizes the incident for your records.</li>
        </ul>
      </section>

      <hr className="my-12 border-slate-800" />

      <section id="how-it-works" className="scroll-mt-32">
        <h2 className="text-3xl tracking-tight !mb-6">How It Works</h2>
        <p className="text-slate-300">
          Sherlock operates on a micro-agent architecture orchestrated by a central pipeline. Instead of relying on a single massive prompt, we distribute the workload across specialized, single-purpose AI models to ensure high accuracy and low latency.
        </p>
        <div className="my-8">
          <pre className="!bg-slate-950 !border-slate-800 shadow-xl"><code className="!text-slate-300">
{`Alert Received 
   │
   ├─► [Triage] 
   │      │
   │      ├─► Severity: High
   │      └─► Service: Checkout
   │
   ├─► [Forensics] ◄── Repository Context
   │      │
   │      └─► Suspect Files Identified
   │
   ├─► [Analyst]
   │      │
   │      └─► Root Cause Found (Null Pointer)
   │
   ├─► [Fix Generator]
   │      │
   │      └─► Pull Request Created
   │
   └─► [Postmortem]
          │
          └─► Markdown Report Generated`}
          </code></pre>
        </div>
      </section>

      <hr className="my-12 border-slate-800" />

      <section id="agents" className="scroll-mt-32">
        <h2 className="text-3xl tracking-tight !mb-8">AI Agents Overview</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg hover:border-primary/30 transition-colors">
            <h4 className="font-bold text-foreground mb-3 text-lg flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
               Triage Agent
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">Classifies incoming alerts based on severity, affected service, and urgency. Filters out noise from critical P0/P1 incidents, ensuring your team only gets paged when it matters.</p>
          </div>
          
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg hover:border-primary/30 transition-colors">
            <h4 className="font-bold text-foreground mb-3 text-lg flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
               Forensics Agent
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">Acts like a detective. It cross-references the stack trace with recent git commits, PRs, and file histories to find the &quot;smoking gun&quot; that caused the incident.</p>
          </div>
          
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg hover:border-primary/30 transition-colors">
            <h4 className="font-bold text-foreground mb-3 text-lg flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
               Analyst Agent
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">Reads the forensic data and formulates a hypothesis for the root cause. Explains exactly <em>why</em> the bug occurred in plain English for the engineering team.</p>
          </div>
          
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg hover:border-primary/30 transition-colors">
            <h4 className="font-bold text-foreground mb-3 text-lg flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               Fix & Postmortem
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">Generates code patches, includes missing unit tests, and writes standard markdown postmortem reports for compliance and future reference.</p>
          </div>
        </div>
      </section>

      <hr className="my-12 border-slate-800" />

      <section id="faq" className="scroll-mt-32">
        <h2 className="text-3xl tracking-tight !mb-8">Frequently Asked Questions</h2>
        <div className="space-y-8">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h4 className="text-lg font-bold text-foreground">Do I need to install anything in my repository?</h4>
            <p className="mt-3 text-slate-300 leading-relaxed">No, Sherlock works via API access to your repository (e.g., using GitHub Personal Access Tokens if private) and dynamically reads your code without needing an agent installed on your servers.</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h4 className="text-lg font-bold text-foreground">What programming languages are supported?</h4>
            <p className="mt-3 text-slate-300 leading-relaxed">Sherlock currently supports TypeScript, JavaScript, Python, Go, and Java for deep code analysis and automated fix generation. More languages are continually being added.</p>
          </div>
           <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h4 className="text-lg font-bold text-foreground">Is my codebase secure?</h4>
            <p className="mt-3 text-slate-300 leading-relaxed">Yes. We do not store your proprietary code. Source files are fetched ephemerally into memory during the incident analysis phase and discarded once the postmortem is generated.</p>
          </div>
        </div>
      </section>
    </article>
  )
}
