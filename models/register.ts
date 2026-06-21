// Mongoose populate resolves models by name at runtime. Import every model for
// side effects so Next.js/Turbopack cannot tree-shake referenced schemas away.
import "@/models/User";
import "@/models/Patient";
import "@/models/Report";
import "@/models/ActivityLog";
import "@/models/Settings";
import "@/models/Counter";
