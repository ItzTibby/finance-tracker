import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://osrqncywziubbdvpfnhx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_IiccwC9nEDneDsm8g9T88Q_ZrTls7ik'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)