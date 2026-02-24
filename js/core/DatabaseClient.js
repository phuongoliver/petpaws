// Import Supabase dynamically via CDN or script tag in index.html
// In index.html, we'll add: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

export class DatabaseClient {
    constructor(supabaseUrl, supabaseAnonKey) {
        if (!window.supabase) {
            console.error("Supabase script not detected on window object.");
            return;
        }
        this.client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log("Supabase Client Initialized");
    }

    getClient() {
        return this.client;
    }
}
