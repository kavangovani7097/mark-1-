import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wwhssswkqpqjibzdjnfw.supabase.co'
const supabaseAnonKey = 'sb_publishable_2m1ewWLy9KXTZcj8dkI86w_4fknfEdK'

export { supabaseUrl, supabaseAnonKey }
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
