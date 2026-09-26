import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // O refresh automático em segundo plano (ao carregar qualquer página, não
        // só o /admin) loga um "AuthApiError: Invalid Refresh Token" no console
        // sempre que a sessão salva no navegador não é mais válida no servidor —
        // mesmo assim tratando a falha corretamente (desloga o usuário). Cada
        // chamada ao Supabase (from/storage/etc.) já revalida e renova a sessão
        // sob demanda via getSession() antes da requisição, então desligar esse
        // timer automático não afeta o login do admin, só evita o log ruidoso.
        autoRefreshToken: false,
    },
});
