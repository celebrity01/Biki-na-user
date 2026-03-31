import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qaymmxweppcqumvegkgf.supabase.co'
const supabaseKey = 'sb_publishable_94rvy5DoH7V04dxSHcFCWg_mn084ohv'
export const supabase = createClient(supabaseUrl, supabaseKey)
