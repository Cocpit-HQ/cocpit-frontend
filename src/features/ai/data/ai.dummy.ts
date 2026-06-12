export interface DummyResponse {
  keywords: string[];
  response: string;
}

export const DUMMY_RESPONSES: DummyResponse[] = [
  // --- REACT & COMPONENT DEVELOPMENT (1-10) ---
  {
    keywords: ["react", "component", "reusable", "props"],
    response: "When building reusable React components, aim for strict isolation. Decouple your business logic into custom hooks, use clear and descriptive TypeScript interfaces for Props, and leverage Tailwind or styled tokens for theme compliance. Avoid inline state that can be shared via contexts or state stores."
  },
  {
    keywords: ["custom", "hook", "use", "logic"],
    response: "Custom hooks are perfect for state encapsulation. A standard custom hook should manage one cohesive concern: e.g., const { data, loading, error } = useFetch(endpoint). Make sure to wrap callback functions in useCallback and state computations in useMemo to prevent unnecessary re-render triggers."
  },
  {
    keywords: ["react-router", "link", "routing", "navigation"],
    response: "For seamless SPA routing, use client-side Link components instead of standard anchor tags. This prevents full-page browser reloads, pre-fetches linked assets in the background, and keeps your route transitions feeling lightning fast."
  },
  {
    keywords: ["useeffect", "effect", "cleanup", "interval"],
    response: "Always return cleanups in useEffect to prevent memory leaks. E.g., when setting an interval or adding event listeners, clear/remove them: useEffect(() => { const timer = setInterval(tick, 1000); return () => clearInterval(timer); }, [])."
  },
  {
    keywords: ["usememo", "usecallback", "memo", "re-render"],
    response: "Use useMemo to cache expensive calculations: const computed = useMemo(() => processData(raw), [raw]). Use useCallback to memoize callbacks passed to memoized children: const handleSelect = useCallback((id) => setSelected(id), [])."
  },
  {
    keywords: ["usestate", "state", "updater", "batching"],
    response: "State updates in React are batched for performance. Always use the functional updater pattern if your new state depends on the previous state: setState(prev => prev + 1). This ensures you are working with the absolute latest state value."
  },
  {
    keywords: ["useref", "ref", "dom", "element"],
    response: "useRef stores mutable references that don't trigger re-renders. It's ideal for accessing DOM nodes (e.g., calling textarea.focus() or measuring scrollHeight) and storing timer IDs across render cycles."
  },
  {
    keywords: ["context", "usecontext", "provider", "global"],
    response: "React Context is built for dependency injection and sharing low-frequency globals like theme configurations, translations, or current session data. For high-frequency state updates, prefer Zustand or Redux to bypass component-tree re-render cascades."
  },
  {
    keywords: ["suspense", "lazy", "import", "loading"],
    response: "Use React.lazy and Suspense to code-split bulky routes or components: const heavyComponent = React.lazy(() => import('./HeavyComponent')). This decreases the initial bundle size, serving a smaller baseline JavaScript payload to the client."
  },
  {
    keywords: ["hydration", "ssr", "mismatch", "server"],
    response: "Hydration mismatches happen when pre-rendered HTML on the server deviates from client-side state. Avoid referencing window or document directly in the initial render; instead, defer client-only scripts inside a useEffect hook."
  },

  // --- NEXT.JS DEVELOPMENT (11-20) ---
  {
    keywords: ["nextjs", "app", "router", "layout"],
    response: "The Next.js App Router enforces a layout-centric architecture. Define root layout files (layout.tsx) to persist headers/footers, and page files (page.tsx) for individual routes. Sub-folders create nested route paths automatically."
  },
  {
    keywords: ["rsc", "server-component", "client-component", "use-client"],
    response: "Next.js defaults to Server Components (RSCs) to fetch data on the server and minimize client-side JS bundles. Add 'use client' at the top of files that require user interaction, hooks (useState, useEffect), or browser APIs."
  },
  {
    keywords: ["server-action", "actions", "form", "mutation"],
    response: "Server Actions allow you to run backend mutations directly from your JSX. Define them with 'use server' in separate files or inline, and trigger them using standard HTML form actions to support progressive enhancement."
  },
  {
    keywords: ["middleware", "proxy", "redirect", "headers"],
    response: "Next.js Middleware runs before a request completes. It is ideal for routing, URL rewrites, managing security headers, checking session tokens, and redirecting unauthenticated users away from private directories."
  },
  {
    keywords: ["static", "incremental", "isr", "prerendering"],
    response: "Incremental Static Regeneration (ISR) lets you update static pages without rebuilding the entire app. Set fetch revalidate intervals: fetch('/api/data', { next: { revalidate: 3600 } }) to automatically regenerate pages in the background."
  },
  {
    keywords: ["seo", "meta", "metadata", "sitemap"],
    response: "Optimize Next.js SEO by export static or dynamic metadata objects in your pages: export const metadata = { title: 'Dashboard', description: 'Real-time metrics' }. This sets head tags correctly for crawler indexers."
  },
  {
    keywords: ["image", "next-image", "optimize", "layout"],
    response: "The next/image component automates modern web image optimizations. It serves responsive layout sizes, converts images to WebP/AVIF formats, prevents Layout Shift (CLS), and lazy loads images outside the viewport."
  },
  {
    keywords: ["fonts", "google-fonts", "next-font", "poppins"],
    response: "next/font downloads google fonts at build time. It hosts fonts locally within your built static assets, preventing layout shifts and removing external font network requests during page loads."
  },
  {
    keywords: ["turbopack", "dev", "build", "bundler"],
    response: "Next.js uses Turbopack in development mode for faster hot module replacement (HMR) and compilation times. Run 'next dev --turbo' to initialize development mode using this optimized Rust-based bundler."
  },
  {
    keywords: ["env", "variables", "public", "private"],
    response: "Define client-accessible variables by prefixing them with NEXT_PUBLIC_ (e.g., NEXT_PUBLIC_API_URL). Private variables (e.g., database connection credentials) must omit this prefix so they never leak into the compiled client bundle."
  },

  // --- STATE MANAGEMENT (21-30) ---
  {
    keywords: ["zustand", "store", "create", "selectors"],
    response: "Zustand provides a lightweight, pub-sub store model. Create a store: const useStore = create((set) => ({ count: 0, inc: () => set(state => ({ count: state.count + 1 })) })). Use exact state selectors to minimize re-renders."
  },
  {
    keywords: ["redux", "toolkit", "slice", "dispatch"],
    response: "Redux Toolkit simplifies state architectures. Define slices with state mutations written via Immer, dispatch actions using useDispatch, and read optimized sub-states via useSelector selectors."
  },
  {
    keywords: ["actions", "reducers", "store", "dispatch"],
    response: "A standard flux cycle dispatches actions to describe occurrences, reducers compute the new state based on action payloads, and components read from the store to re-render UI views dynamically."
  },
  {
    keywords: ["localstorage", "persist", "cookies", "session"],
    response: "Persist state across sessions by synchronizing states to localStorage or using cookies for server-side availability. If using Next.js SSR, remember to handle hydration lag by deferring localStorage reads to the client."
  },
  {
    keywords: ["query", "tanstack", "cache", "fetch"],
    response: "TanStack Query manages server state caching. It exposes hooks like useQuery and useMutation, handles auto-refetching, request deduplication, loading states, cache invalidations, and background updates automatically."
  },
  {
    keywords: ["mutation", "optimistic", "update", "invalidate"],
    response: "Implement optimistic mutations to update the local UI before the API confirms. On error, rollback to the cached state. On success, call queryClient.invalidateQueries to sync the actual data from the database."
  },
  {
    keywords: ["cache", "refetch", "stale", "inactive"],
    response: "Control data caching with staleTime and gcTime. Set staleTime to define how long data remains fresh before refetching is triggered, and gcTime to set when unused data gets pruned from the client cache memory."
  },
  {
    keywords: ["form", "react-hook-form", "register", "validation"],
    response: "react-hook-form reduces render overhead by registering inputs as uncontrolled fields. Validate fields via integrations with schema parsers like Zod or custom validation callbacks on form submit."
  },
  {
    keywords: ["zod", "validation", "schema", "parse"],
    response: "Zod handles runtime type validations. Construct strict schemas: const schema = z.object({ email: z.string().email() }). Use schema.safeParse(data) to validate form fields or validate incoming API payloads."
  },
  {
    keywords: ["graphql", "apollo", "client", "query"],
    response: "GraphQL client frameworks manage state by cache normalization. Define queries and mutations with gql strings and bind them to components using Apollo or Urql hooks for declarative fetching."
  },

  // --- GRAPHICS, CHARTS & VISUALIZATIONS (31-45) ---
  {
    keywords: ["recharts", "charts", "responsive", "bar"],
    response: "When rendering Recharts, wrap your components in ResponsiveContainer with aspect ratio or percentage dimensions. Provide structured data arrays, declare XAxis/YAxis components, and custom-style Tooltips to maintain premium designs."
  },
  {
    keywords: ["svg", "draw", "circle", "rect", "path"],
    response: "SVGs represent resolution-independent visual assets. Render inline SVG tags in React: <svg><circle cx='50' cy='50' r='40' fill='#6366F1' /></svg>. Customize color fills and strokes using CSS variables for theme flexibility."
  },
  {
    keywords: ["canvas", "2d", "render", "pixels"],
    response: "HTML5 Canvas is designed for rendering high-performance raster graphics. Access the 2d context: const ctx = canvas.getContext('2d'), and draw paths inside animation loops: requestAnimationFrame(drawLoop) for graphics performance."
  },
  {
    keywords: ["d3", "selection", "data", "scales"],
    response: "D3.js binds data to document elements. Use d3-scale to map data spaces to screen coordinates (e.g., d3.scaleLinear().domain([0, 100]).range([0, width])), and leverage selections to perform visual transitions."
  },
  {
    keywords: ["graph", "nodes", "edges", "network"],
    response: "To draw node-link graph visualization, represent nodes as points and edges as connecting line vectors. Render them using SVG paths or Canvas nodes, calculating their layouts with force-directed physics models."
  },
  {
    keywords: ["force", "directed", "physics", "layout"],
    response: "Force-directed layouts calculate node coordinate layouts based on spring-like link forces and electrostatic charge repulsions. This produces clear layouts for social networks or data dependencies."
  },
  {
    keywords: ["color", "palette", "hsl", "gradient"],
    response: "Design clean charts by defining gradient offsets: <linearGradient id='grad' x1='0' y1='0' x2='0' y2='1'><stop offset='5%' stopColor='#6366F1' stopOpacity={0.8}/><stop offset='95%' stopColor='#6366F1' stopOpacity={0}/></linearGradient>."
  },
  {
    keywords: ["chartjs", "chart", "config", "canvas"],
    response: "Chart.js draws responsive canvas charts. Initialize it with a config object specifying dataset values, color scales, animation durations, hover configs, and tooltips, then clean up the instance on component unmount."
  },
  {
    keywords: ["pie", "donut", "chart", "percentage"],
    response: "Donut charts highlight relative percentages. Keep segment count under 6 slices to maintain clean graphics. Always include clear data tables or legend labels for accessibility."
  },
  {
    keywords: ["line", "area", "chart", "trend"],
    response: "Line and Area charts track dynamic metrics over time. Smooth line paths with curve types like d3.curveMonotoneX or Recharts type='monotone' to prevent jagged vectors."
  },
  {
    keywords: ["animation", "canvas", "frame", "loop"],
    response: "Create smooth web animations by synchronizing canvas drawings with the browser frame refresh cycle using requestAnimationFrame. Track elapsed delta times to keep animation velocities consistent."
  },
  {
    keywords: ["tooltip", "hover", "chart", "custom"],
    response: "Design premium chart tooltips by setting the default Tooltip component to custom: <Tooltip content={<CustomTooltip />} />. Style the container with a backdrop blur filter and smooth opacity transitions."
  },
  {
    keywords: ["grid", "axis", "labels", "ticks"],
    response: "Keep chart grids minimal by setting tick lines and axis lines to transparent, leaving only clean grid lines. Set grid strokeDasharray='3 3' and use light gray/blue strokes."
  },
  {
    keywords: ["svg-path", "vector", "bezier", "bezier-curve"],
    response: "SVG path data (d attribute) creates vector shapes. Commands: M moves to coordinates, L draws lines, C draws cubic Bezier curves, and Z closes the path outline."
  },
  {
    keywords: ["responsive", "container", "charts", "resize"],
    response: "To build responsive charts, set the width of ResponsiveContainer to 100% and provide a fixed aspect ratio (e.g., aspect={3}) to let the chart scale dynamically without layout breakdowns."
  },

  // --- DASHBOARDS, METRICS & TABLES (46-55) ---
  {
    keywords: ["dashboard", "widgets", "grid", "cards"],
    response: "Build responsive dashboard grid layouts using CSS Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4. Apply consistent border-radii, custom shadows, and glassmorphic styles."
  },
  {
    keywords: ["kpi", "metrics", "analytics", "dashboard"],
    response: "KPI cards showcase performance metrics. Structure cards with a top label, a bold value, a progress percentage indicator, and a mini sparkline chart to show context."
  },
  {
    keywords: ["table", "pagination", "columns", "rows"],
    response: "Display rich datasets inside modular tables. Style table headers with low-opacity text, set explicit column widths, truncate long cell text, and implement client or server pagination controls."
  },
  {
    keywords: ["csv", "xlsx", "export", "file"],
    response: "Export tabular data to CSV by formatting rows into comma-separated text strings, creating a Blob: new Blob([csvContent], { type: 'text/csv' }), and triggering a programmatic client-side download."
  },
  {
    keywords: ["glassmorphism", "blur", "backdrop", "opacity"],
    response: "Achieve glassmorphism using CSS backdrop-filter: backdrop-blur(12px), setting a translucent background: background: rgba(255, 255, 255, 0.65), and adding a fine 1px white border."
  },
  {
    keywords: ["sorting", "filtering", "search", "data"],
    response: "Combine search and sorting in a custom utility hook: filter by query keywords, then apply sorting algorithms using localeCompare or numeric differences depending on the key type."
  },
  {
    keywords: ["sparkline", "mini", "trend", "chart"],
    response: "A sparkline is a mini line chart designed without axes, labels, or grid lines. It fits inside KPI cards or table cells to provide a quick visual trend indicator."
  },
  {
    keywords: ["summary", "totals", "aggregation", "sums"],
    response: "Compute summary metrics using reduce functions: const total = data.reduce((sum, item) => sum + item.value, 0). Render aggregated values at the top of the dashboard for quick scanability."
  },
  {
    keywords: ["grid-layout", "draggable", "resizable", "dashboard"],
    response: "For custom dashboard personalization, integrate libraries like react-grid-layout to support user-customizable dashboard panels, and persist layout configurations back to the database."
  },
  {
    keywords: ["realtime", "live", "metrics", "updates"],
    response: "Keep dashboard metrics live by establishing WebSocket connections, setting up SSE channels, or configuring React Query auto-refetch intervals to sync changes."
  },

  // --- USER PROFILES, BIOS & ONBOARDING (56-65) ---
  {
    keywords: ["profile", "career", "summary", "skills"],
    response: "Professional profiles aggregate background summaries, core skills, employment history, and projects. Highlight key deliverables inside expandable cards."
  },
  {
    keywords: ["bio", "about", "write", "summary"],
    response: "A modern bio should start with a 1-sentence value statement, list 4-5 core tech competencies, outline current achievements, and list preferred technologies for future collaboration."
  },
  {
    keywords: ["onboarding", "steps", "wizard", "user"],
    response: "Structure user onboarding as a multi-step form wizard. Validate inputs at each step, persist partial state, and provide a clear progress bar."
  },
  {
    keywords: ["avatar", "image", "upload", "crop"],
    response: "Implement crop integrations on avatar uploads using libraries like react-easy-crop. Restrict file sizes on the client and compress images to WebP before saving."
  },
  {
    keywords: ["skills-tag", "tags", "badge", "chips"],
    response: "Display skills as interactive, colorful tags or chips. Support filters on chips so users can browse profiles containing specific skills."
  },
  {
    keywords: ["education", "experience", "timeline", "history"],
    response: "Build timelines for experience sections using custom vertical CSS borders, small indicator circle icons, and clear typography for date periods."
  },
  {
    keywords: ["recruiter", "view", "linkedin", "resume"],
    response: "Format profile summaries for quick scanning by recruiters: list years of experience at the top, group skills by category, and highlight notable project contributions."
  },
  {
    keywords: ["validation", "form", "error", "message"],
    response: "Render validation errors inline directly under form fields. Set borders to light red (#EF4444) and write clear help messages to improve the user experience."
  },
  {
    keywords: ["save-draft", "draft", "persistence", "form"],
    response: "Preserve long onboarding step states by caching data to sessionStorage. On component mount, populate the form inputs with the stored draft if it exists."
  },
  {
    keywords: ["verify-profile", "badge", "status", "complete"],
    response: "Include profile completion meters. As users add sections (e.g. bio, experience, skills), calculate percentages and show a completion status bar."
  },

  // --- REAL-TIME MESSAGING & WEB-SOCKETS (66-75) ---
  {
    keywords: ["websocket", "socket", "io", "connection"],
    response: "Establish WebSocket clients using socket.io-client. Initialize inside a React Context to reuse the connection across pages, and clean up event listeners on unmount."
  },
  {
    keywords: ["chat", "realtime", "messages", "inbox"],
    response: "Build modular chat panes by splitting the layout into a left sidebar showing active conversations, and a right window displaying message logs and the input field."
  },
  {
    keywords: ["presence", "online", "status", "indicator"],
    response: "Manage user online status indicators by broadcasting presence heartbeats over WebSockets. Update the UI with green dots for active users."
  },
  {
    keywords: ["thread", "message", "replies", "conversations"],
    response: "Support message threading by nesting replies under primary messages. Use visual indentation guides to separate thread levels."
  },
  {
    keywords: ["typing", "indicator", "active", "status"],
    response: "Show typing indicators by catching typing events from the socket. Debounce events using lodash.debounce to avoid constant state modifications."
  },
  {
    keywords: ["unread", "badge", "count", "notifications"],
    response: "Track unread message counts in a global state store. Clear unread numbers for a conversation when the scroll view mounts or updates."
  },
  {
    keywords: ["emoji", "picker", "messages", "reaction"],
    response: "Implement message reactions by displaying emoji pickers on hover. Store reactions inside the message schema as arrays mapping emojis to user IDs."
  },
  {
    keywords: ["scroll-bottom", "chat", "scroll", "smooth"],
    response: "Auto-scroll chats by referencing a bottom-anchored div: bottomRef.current.scrollIntoView({ behavior: 'smooth' }) whenever the message list updates."
  },
  {
    keywords: ["offline", "sync", "retry", "queue"],
    response: "Queue pending messages in local state when offline. Once connection is restored, flush the queue to send messages back to the server."
  },
  {
    keywords: ["notification", "push", "toast", "message"],
    response: "Display toast notifications for incoming messages using libraries like sonner when the user is currently browsing other views of the app."
  },

  // --- AUTHENTICATION & SECURITY (76-85) ---
  {
    keywords: ["auth", "nextauth", "session", "jwt"],
    response: "NextAuth coordinates sessions using JSON Web Tokens (JWT). Define callbacks in authOptions to inject JWT attributes like accessTokens directly into user sessions."
  },
  {
    keywords: ["refresh", "token", "jwt", "rotation"],
    response: "Implement refresh token rotation by intercepting token requests. If the accessToken is expired, call the refresh endpoint to get new credentials."
  },
  {
    keywords: ["credentials", "login", "password", "email"],
    response: "Support secure credentials login. Ensure inputs are hashed with bcryptjs on the backend, and validate fields with strict patterns on the client."
  },
  {
    keywords: ["oauth", "google", "login", "provider"],
    response: "Enable Google OAuth sign-in. Exchange idTokens returned by the provider for backend API session tokens, validating scopes during authorization."
  },
  {
    keywords: ["role", "permissions", "access", "admin"],
    response: "Enforce role-based access control (RBAC). Check permissions before mounting pages or triggering api actions."
  },
  {
    keywords: ["middleware", "auth", "protected", "routes"],
    response: "Protect routes by checking session validation in middleware files before routing requests, redirecting unauthenticated users to the login screen."
  },
  {
    keywords: ["logout", "signout", "clear", "session"],
    response: "Handle user sign-outs by calling NextAuth's signOut method, clearing localStorage states, and redirecting the browser to the root login page."
  },
  {
    keywords: ["cors", "api", "origin", "headers"],
    response: "Resolve CORS exceptions by configuring appropriate Access-Control-Allow-Origin headers in backend responses to allow requests from frontend hosts."
  },
  {
    keywords: ["cookies", "secure", "http-only", "storage"],
    response: "Store authentication tokens inside HttpOnly, Secure cookies to protect credentials from access via JavaScript scripts (preventing XSS attacks)."
  },
  {
    keywords: ["encryption", "security", "hash", "salt"],
    response: "Ensure sensitive data is encrypted. Secure passphrases on database records using salt operations and standard hashing functions like Argon2 or BCrypt."
  },

  // --- DATABASE & DATA LAYER (86-92) ---
  {
    keywords: ["prisma", "schema", "model", "migration"],
    response: "Prisma handles database schemas. Define models, run 'npx prisma migrate dev' to create migrations, and use Prisma Client for type-safe queries."
  },
  {
    keywords: ["seeding", "seed", "mock", "database"],
    response: "Write seeding scripts in prisma/seed.ts. Use client create commands to populate the database with default records for development."
  },
  {
    keywords: ["migration", "sql", "alter", "deploy"],
    response: "Run database migrations in CI/CD pipelines using 'npx prisma migrate deploy' to update schema definitions without database loss."
  },
  {
    keywords: ["query", "postgres", "sql", "orm"],
    response: "Optimize database queries by select only required fields, indexing foreign keys, and lazy-loading relations to prevent N+1 issues."
  },
  {
    keywords: ["transaction", "rollback", "acid", "batch"],
    response: "Use database transactions: prisma.$transaction([query1, query2]) to run multiple queries sequentially, rolling back changes if any query fails."
  },
  {
    keywords: ["relation", "foreign", "key", "join"],
    response: "Establish relations using foreign keys. Set up referential actions (e.g. onDelete: Cascade) to keep data references synchronized."
  },
  {
    keywords: ["prisma-client", "client", "db", "singleton"],
    response: "Prevent database connection pool exhaustions in development by exporting Prisma Client as a global singleton instance across module compiles."
  },

  // --- PERFORMANCE, STYLING & TESTING (93-100) ---
  {
    keywords: ["performance", "bundle", "splitting", "minify"],
    response: "Maximize app performance by splitting large dependencies, optimizing bundle assets, and deferring non-critical scripts."
  },
  {
    keywords: ["lighthouse", "vitals", "speed", "score"],
    response: "Optimize Google Core Web Vitals (LCP, INP, CLS) by setting static sizes on images, reducing layout shifts, and avoiding blocking render scripts."
  },
  {
    keywords: ["tailwind", "css", "styling", "postcss"],
    response: "Style layouts rapidly with Tailwind CSS. Combine class parameters safely with tailwind-merge to avoid class conflicts in dynamic states."
  },
  {
    keywords: ["dark-mode", "theme", "toggle", "css"],
    response: "Implement dark mode using CSS variables or Tailwind's dark class selector. Store user theme preferences in localStorage or cookies."
  },
  {
    keywords: ["animation", "framer-motion", "transition", "slide"],
    response: "Build elegant transitions using framer-motion: <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} /> to make interfaces feel reactive."
  },
  {
    keywords: ["testing", "jest", "vitest", "unit"],
    response: "Write unit tests using Vitest or Jest. Wrap test targets in required ThemeProviders, React Query providers, or mock routers to test functionality."
  },
  {
    keywords: ["mocking", "api", "msw", "server"],
    response: "Mock backend API endpoints in tests using Mock Service Worker (MSW) to validate frontend responses under different simulated status codes."
  },
  {
    keywords: ["e2e", "playwright", "cypress", "test"],
    response: "Perform E2E tests using Playwright. Write test specs to simulate login flows, dashboard interactions, and verify UI structures across viewports."
  }
];

export const DEFAULT_RESPONSE = "That is a great point! Let me look into that further. I recommend starting with a modular architecture, clean components, and keeping your business logic decoupled from the UI layer.";
