# Sherlock Frontend - AI Incident Response Co-pilot

Frontend web application untuk Sherlock, dibangun dengan Next.js 14, React, TypeScript, dan Tailwind CSS.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ atau 20+
- npm, yarn, atau pnpm
- Backend API running di `http://localhost:8000`

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# atau
yarn install
# atau
pnpm install
```

### Running Development Server

```bash
# Start development server
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

Frontend akan berjalan di `http://localhost:3000`

### Building for Production

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
frontend/
├── app/
│   ├── globals.css           # Global styles & Tailwind
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page (incident submission)
│   └── incidents/
│       └── [id]/
│           └── page.tsx      # Incident analysis page (SSE streaming)
│
├── components/
│   └── AgentCard.tsx         # Agent status card component
│
├── lib/                      # Utility functions (future)
│
├── public/                   # Static assets
│
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## 🎨 Features

### Landing Page (`/`)

- **Incident Submission Form**
  - Textarea untuk paste alert/error message
  - Repository path input
  - Sample alert loader
  - Form validation

- **Hero Section**
  - Feature highlights
  - Value proposition
  - Call-to-action

### Incident Analysis Page (`/incidents/[id]`)

- **Real-time Agent Pipeline**
  - 5 agent cards dengan status updates
  - Server-Sent Events (SSE) streaming
  - Live progress indicators
  - Animated transitions

- **Agent Cards**
  - Triage Agent - Severity classification
  - Forensics Agent - Git history analysis
  - Bob Analyst Agent - Root cause analysis ⭐
  - Fix Agent - Code patch generation ⭐
  - Postmortem Agent - Documentation

- **Results Display**
  - Structured data visualization
  - Color-coded severity levels
  - Confidence scores
  - File lists and commit info

- **Completion Actions**
  - View postmortem button
  - Analyze another incident
  - Time saved banner

## 🔧 Configuration

### API Proxy

Next.js automatically proxies `/api/*` requests ke backend:

```javascript
// next.config.js
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ]
}
```

### Environment Variables

Create `.env.local` untuk custom configuration:

```bash
# Backend API URL (optional, defaults to localhost:8000)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🎨 Styling

### Tailwind CSS

Project menggunakan Tailwind CSS dengan custom configuration:

- **Dark Theme** - Default dark mode dengan gradient backgrounds
- **Custom Colors** - Ops-grade color palette
- **Animations** - Slide-in, pulse, spin animations
- **Responsive** - Mobile-first responsive design

### Custom CSS

Global styles di `app/globals.css`:
- Custom scrollbar styling
- Markdown content styling
- Animation keyframes
- Utility classes

## 🔌 API Integration

### Submit Incident

```typescript
const response = await fetch('/api/incidents/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    raw_input: alertText,
    repo_path: repoPath,
  }),
})

const data = await response.json()
// { incident_id, status, message, stream_url }
```

### Stream Analysis (SSE)

```typescript
const eventSource = new EventSource(
  `/api/incidents/${incidentId}/stream?raw_input=${rawInput}&repo_path=${repoPath}`
)

eventSource.onmessage = (event) => {
  const agentEvent = JSON.parse(event.data)
  // Handle agent status updates
}
```

### Event Types

```typescript
interface AgentEvent {
  agent_name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  message: string
  data?: any
  timestamp: string
}
```

## 🧩 Components

### AgentCard

Reusable component untuk menampilkan agent status:

```tsx
<AgentCard
  name="Triage"
  status="completed"
  message="Triage completed: HIGH severity"
  data={{ severity: 'high', error_type: 'null_pointer' }}
  index={0}
/>
```

**Props:**
- `name` - Agent display name
- `status` - Current status (pending/running/completed/failed)
- `message` - Status message
- `data` - Optional result data
- `index` - For staggered animations

## 🎯 User Flow

1. **Landing Page**
   - User pastes alert/error message
   - Enters repository path
   - Clicks "Start Analysis"

2. **Redirect to Analysis Page**
   - URL: `/incidents/{id}?raw_input=...&repo_path=...`
   - SSE connection established

3. **Real-time Updates**
   - Agent cards update as pipeline progresses
   - Status changes: pending → running → completed
   - Results displayed in each card

4. **Completion**
   - All agents completed
   - "View Postmortem" button enabled
   - Time saved banner displayed

## 🐛 Troubleshooting

### Backend Connection Issues

```bash
# Check if backend is running
curl http://localhost:8000/health

# Check Next.js proxy
# Open browser DevTools → Network tab
# Look for /api/incidents requests
```

### SSE Connection Fails

- Ensure backend is running
- Check CORS configuration in backend
- Verify query parameters are properly encoded
- Check browser console for errors

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## 📱 Responsive Design

- **Mobile** (< 768px) - Single column layout
- **Tablet** (768px - 1024px) - Optimized spacing
- **Desktop** (> 1024px) - Full feature layout

## ♿ Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

## 🚀 Performance

- **Next.js 14** - App Router dengan React Server Components
- **Code Splitting** - Automatic route-based splitting
- **Image Optimization** - Next.js Image component (when used)
- **CSS Optimization** - Tailwind CSS purging

## 🔮 Future Enhancements

- [ ] Dark/Light theme toggle
- [ ] Incident history dashboard
- [ ] Real-time collaboration
- [ ] Export results (PDF, JSON)
- [ ] Advanced filtering and search
- [ ] Metrics and analytics
- [ ] Notification system
- [ ] Multi-language support

## 🤝 Development

### Code Style

- TypeScript strict mode
- ESLint configuration
- Prettier formatting (recommended)
- Component-based architecture

### Adding New Pages

```bash
# Create new page
mkdir -p app/new-page
touch app/new-page/page.tsx
```

### Adding New Components

```bash
# Create new component
touch components/NewComponent.tsx
```

## 📄 License

MIT License - IBM Bob Hackathon 2026

---

**Built with ❤️ for IBM Bob Hackathon**

*Sherlock - From alert to fix PR in 5 minutes*
