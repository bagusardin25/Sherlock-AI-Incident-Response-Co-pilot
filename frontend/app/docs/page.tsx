import CodeBlock from '@/components/CodeBlock'

export default function DocsPage() {
  return (
    <article className="markdown-content max-w-4xl">
      <section id="introduction" className="scroll-mt-32">
        <h1 className="text-4xl lg:text-5xl tracking-tight !mb-6">Sherlock Documentation</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          <strong>Sherlock</strong> is an AI-powered incident response co-pilot that resolves production incidents from alert to pull request in under 3 minutes. Powered by IBM Bob for deep codebase reasoning.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-black/10 dark:border-slate-800 text-center">
            <p className="text-2xl font-bold text-primary">~25s</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Average resolution time</p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-black/10 dark:border-slate-800 text-center">
            <p className="text-2xl font-bold text-primary">5</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Specialized AI agents</p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-black/10 dark:border-slate-800 text-center">
            <p className="text-2xl font-bold text-primary">3</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Surfaces: CLI, Web, CI/CD</p>
          </div>
        </div>
      </section>

      <hr className="my-12 border-black/10 dark:border-slate-800" />

      <section id="installation" className="scroll-mt-32">
        <h2 className="text-3xl tracking-tight !mb-8">Getting Started</h2>

        <h3 className="text-xl font-semibold !mt-8 !mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">1</span>
          Create your account
        </h3>
        <p className="text-slate-600 dark:text-slate-300">
          Sign up at the Sherlock dashboard. After registration, you&apos;ll have access to the web interface and can generate API keys for the CLI.
        </p>

        <h3 className="text-xl font-semibold !mt-8 !mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">2</span>
          Generate an API key
        </h3>
        <p className="text-slate-600 dark:text-slate-300">
          Navigate to <strong>Settings → API Keys</strong> in the dashboard and create a new key. You&apos;ll need this to authenticate the CLI and any CI/CD integrations.
        </p>

        <h3 className="text-xl font-semibold !mt-8 !mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">3</span>
          Install the CLI <span className="text-sm font-normal text-slate-500">(optional)</span>
        </h3>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          For terminal-based workflows, install the Sherlock CLI globally:
        </p>
        <CodeBlock code="npm install -g @bagusardin25/sherlock-cli" language="bash" />
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">Requires Node.js 18 or higher.</p>

        <h3 className="text-xl font-semibold !mt-8 !mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">4</span>
          Authenticate the CLI
        </h3>
        <CodeBlock code={`sherlock-cli auth login\n\nWeb login: https://sherlock-ai.up.railway.app/api/auth/google/login\nEnter API key: sk_sherlock_********\n\nOK Authentication complete\n\nsherlock-cli`} language="bash" />
      </section>

      <hr className="my-12 border-black/10 dark:border-slate-800" />

      <section id="quickstart" className="scroll-mt-32">
        <h2 className="text-3xl tracking-tight !mb-8">Using the Web Dashboard</h2>

        <h3 className="text-xl font-semibold !mt-8 !mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">1</span>
          Submit an incident
        </h3>
        <p className="text-slate-600 dark:text-slate-300">
          From the main dashboard, paste your stack trace, error log, or alert payload into the investigation input. The more context you provide, the more accurate the diagnosis.
        </p>

        <h3 className="text-xl font-semibold !mt-8 !mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">2</span>
          Connect your repository
        </h3>
        <p className="text-slate-600 dark:text-slate-300">
          Provide your repository URL (e.g., GitHub). Sherlock uses this to understand your codebase architecture, analyze git history, and generate accurate fixes.
        </p>

        <h3 className="text-xl font-semibold !mt-8 !mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">3</span>
          Watch the agents work
        </h3>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          Sherlock runs a 5-agent pipeline in real-time. You can watch each agent&apos;s progress live on the dashboard:
        </p>
        <ul className="space-y-2 text-slate-600 dark:text-slate-300 ml-4">
          <li><strong className="text-slate-900 dark:text-white">Triage</strong> — classifies severity and affected service</li>
          <li><strong className="text-slate-900 dark:text-white">Forensics</strong> — identifies suspect commits and files</li>
          <li><strong className="text-slate-900 dark:text-white">Analyst</strong> — determines root cause with evidence</li>
          <li><strong className="text-slate-900 dark:text-white">Fix</strong> — generates a code patch and regression test</li>
          <li><strong className="text-slate-900 dark:text-white">Postmortem</strong> — writes the incident report</li>
        </ul>

        <h3 className="text-xl font-semibold !mt-8 !mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">4</span>
          Review results
        </h3>
        <p className="text-slate-600 dark:text-slate-300">
          Once complete, review the root cause analysis, apply the suggested fix, and share the auto-generated postmortem with your team.
        </p>
      </section>

      <hr className="my-12 border-black/10 dark:border-slate-800" />

      <section id="cli-commands" className="scroll-mt-32">
        <h2 className="text-3xl tracking-tight !mb-8">CLI Reference</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          The Sherlock CLI provides an interactive shell for terminal-based incident response. Launch it by running <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">sherlock-cli</code>.
        </p>

        <div className="mb-8">
          <CodeBlock code={`$ sherlock-cli\n\nSherlock Incident Response Shell\nPowered by IBM Bob repository intelligence\n\nConnected to Sherlock Cloud\nWorkspace      production\nAuthenticated  yes\n\nsherlock ›`} language="bash" />
        </div>

        <h3 className="text-xl font-semibold !mt-8 !mb-4">Slash commands</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-black/10 dark:border-slate-800">
                <th className="py-3 pr-4 text-slate-500 dark:text-slate-400 font-medium">Command</th>
                <th className="py-3 text-slate-500 dark:text-slate-400 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 dark:text-slate-300">
              <tr className="border-b border-black/5 dark:border-black/10 dark:border-slate-800/50">
                <td className="py-3 pr-4"><code className="text-primary">/resolve &lt;file&gt;</code></td>
                <td className="py-3">Run the full 5-agent pipeline on an alert file</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-black/10 dark:border-slate-800/50">
                <td className="py-3 pr-4"><code className="text-primary">/status [id]</code></td>
                <td className="py-3">List incidents or show detail for one</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-black/10 dark:border-slate-800/50">
                <td className="py-3 pr-4"><code className="text-primary">/fix [id]</code></td>
                <td className="py-3">View the generated patch and regression test</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-black/10 dark:border-slate-800/50">
                <td className="py-3 pr-4"><code className="text-primary">/postmortem [id]</code></td>
                <td className="py-3">View the incident report</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-black/10 dark:border-slate-800/50">
                <td className="py-3 pr-4"><code className="text-primary">/open [id]</code></td>
                <td className="py-3">Open the incident at https://sherlockai-ibm.vercel.app/incidents/[id]</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-black/10 dark:border-slate-800/50">
                <td className="py-3 pr-4"><code className="text-primary">/history</code></td>
                <td className="py-3">Show recent incidents from this session</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-black/10 dark:border-slate-800/50">
                <td className="py-3 pr-4"><code className="text-primary">/auth login</code></td>
                <td className="py-3">Open web login, create an API key, and save it locally</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-black/10 dark:border-slate-800/50">
                <td className="py-3 pr-4"><code className="text-primary">/help</code></td>
                <td className="py-3">Show all available commands</td>
              </tr>
              <tr>
                <td className="py-3 pr-4"><code className="text-primary">/exit</code></td>
                <td className="py-3">Leave the shell</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong className="text-primary">💡 Tip:</strong> After resolving an incident, the prompt becomes <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">sherlock(inc-xxxxx) ›</code> — all follow-up commands automatically use that incident ID.
          </p>
        </div>

        <h3 className="text-xl font-semibold !mt-10 !mb-4">CI/CD integration</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          Use one-shot commands directly in your pipelines:
        </p>
        <CodeBlock code={`sherlock-cli resolve crash.log --repo https://github.com/org/service\nsherlock-cli fix inc-a1b2c3d4 --output fix.patch\nsherlock-cli postmortem inc-a1b2c3d4 --output incident.md`} language="bash" />
      </section>

      <hr className="my-12 border-black/10 dark:border-slate-800" />

      <section id="configuration" className="scroll-mt-32">
        <h2 className="text-3xl tracking-tight !mb-8">Configuration</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          The CLI stores configuration in <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">~/.sherlock/config.json</code>. You can also use environment variables:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-black/10 dark:border-slate-800">
                <th className="py-3 pr-4 text-slate-500 dark:text-slate-400 font-medium">Variable</th>
                <th className="py-3 text-slate-500 dark:text-slate-400 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 dark:text-slate-300">
              <tr className="border-b border-black/5 dark:border-black/10 dark:border-slate-800/50">
                <td className="py-3 pr-4"><code className="text-emerald-400">SHERLOCK_API_KEY</code></td>
                <td className="py-3">Your API key (from Settings → API Keys)</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-black/10 dark:border-slate-800/50">
                <td className="py-3 pr-4"><code className="text-emerald-400">SHERLOCK_API_URL</code></td>
                <td className="py-3">API endpoint (defaults to Sherlock cloud)</td>
              </tr>
              <tr>
                <td className="py-3 pr-4"><code className="text-emerald-400">SHERLOCK_WORKSPACE</code></td>
                <td className="py-3">Workspace name shown in the shell header</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <hr className="my-12 border-black/10 dark:border-slate-800" />

      <section id="how-it-works" className="scroll-mt-32">
        <h2 className="text-3xl tracking-tight !mb-6">How It Works</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          When you submit an incident, Sherlock orchestrates a multi-agent pipeline. Each agent is specialized for a single task — no single massive prompt, just focused, high-accuracy steps.
        </p>
        <div className="my-8">
          <CodeBlock code={`Alert Submitted\n   │\n   ├─► [Triage]        Classify severity & route\n   │\n   ├─► [Forensics]     Analyze git history & suspect commits\n   │\n   ├─► [Analyst] ⭐    IBM Bob deep code reasoning\n   │\n   ├─► [Fix] ⭐        Generate patch + regression test\n   │\n   └─► [Postmortem]    Write incident report`} language="text" />
        </div>
        <p className="text-slate-600 dark:text-slate-300">
          The <strong>Analyst</strong> and <strong>Fix</strong> agents use IBM Bob for full-repository reasoning — understanding your architecture, dependency graph, and code patterns to produce accurate root cause analysis and working fixes.
        </p>
      </section>

      <hr className="my-12 border-black/10 dark:border-slate-800" />

      <section id="agents" className="scroll-mt-32">
        <h2 className="text-3xl tracking-tight !mb-8">AI Agents</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-black/10 dark:border-slate-800 shadow-lg hover:border-primary/30 transition-colors">
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-lg flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
               Triage Agent
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Classifies severity, error type, and affected service. Filters noise from critical P0/P1 incidents so your team only gets paged when it matters.</p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-black/10 dark:border-slate-800 shadow-lg hover:border-primary/30 transition-colors">
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-lg flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
               Forensics Agent
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Cross-references stack traces with git history, recent commits, and file changes to identify the exact commit that introduced the bug.</p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-black/10 dark:border-slate-800 shadow-lg hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Bob Analyst Engine ⭐
              </h4>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[8px] font-black uppercase tracking-widest">IBM Bob</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Uses IBM Bob to reason over your full repository. Produces a root cause hypothesis with supporting evidence and confidence score.</p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-black/10 dark:border-slate-800 shadow-lg hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Bob Fix Generator ⭐
              </h4>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[8px] font-black uppercase tracking-widest">IBM Bob</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Generates unified-diff patches and regression tests. Creates PR-ready code fixes that you can review and merge immediately.</p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-black/10 dark:border-slate-800 shadow-lg hover:border-primary/30 transition-colors md:col-span-2">
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-lg flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
               Postmortem Agent
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Aggregates all findings into a publishable incident report with timeline, root cause, fix summary, and prevention recommendations — ready to share with stakeholders.</p>
          </div>
        </div>
      </section>

      <hr className="my-12 border-black/10 dark:border-slate-800" />

      <section id="faq" className="scroll-mt-32">
        <h2 className="text-3xl tracking-tight !mb-8">FAQ</h2>
        <div className="space-y-6">
          <div className="bg-black/5 dark:bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-black/10 dark:border-slate-800">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Do I need to install anything in my repository?</h4>
            <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">No. Sherlock accesses your repository via URL and reads code dynamically. No agents, webhooks, or plugins need to be installed on your servers.</p>
          </div>
          <div className="bg-black/5 dark:bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-black/10 dark:border-slate-800">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">What languages are supported?</h4>
            <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">TypeScript, JavaScript, Python, Go, and Java for deep code analysis and automated fix generation. The forensics agent works with any git repository regardless of language.</p>
          </div>
          <div className="bg-black/5 dark:bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-black/10 dark:border-slate-800">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Is my code secure?</h4>
            <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">Yes. Source files are fetched ephemerally into memory during analysis and discarded immediately after. We do not store your proprietary code.</p>
          </div>
          <div className="bg-black/5 dark:bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-black/10 dark:border-slate-800">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Can I use Sherlock in CI/CD pipelines?</h4>
            <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">Yes. The CLI supports one-shot commands (<code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">sherlock-cli resolve</code>, <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">sherlock-cli fix --output</code>) designed for automation. Set <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">SHERLOCK_API_KEY</code> as an environment variable in your pipeline.</p>
          </div>
          <div className="bg-black/5 dark:bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-black/10 dark:border-slate-800">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Do I need the CLI to use Sherlock?</h4>
            <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">No. The web dashboard provides the full experience — submit alerts, watch agents work in real-time, review fixes, and download postmortems. The CLI is an optional power-user tool for terminal workflows.</p>
          </div>
        </div>
      </section>
    </article>
  )
}
