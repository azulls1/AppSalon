export const environment = {
  production: true,
  // Apuntamos al proxy de nginx (mismo origen) — evita CORS del Supabase self-hosted
  supabaseUrl: '/supabase',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.23LYnOepZ9yTJObLFoTnszO5WdHpbekvgwMt8bn2o_k',
  apiUrl: 'http://localhost:8000/api/v1',
};
