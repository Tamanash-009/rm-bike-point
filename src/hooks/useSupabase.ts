import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { createClerkSupabaseClient, supabase as anonSupabase } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export function useSupabase() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [supabase, setSupabase] = useState<SupabaseClient>(anonSupabase);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    if (!isLoaded) return;
    
    if (isSignedIn) {
      getToken().then(token => {
        if (isMounted && token) {
          setSupabase(createClerkSupabaseClient(token));
          setIsReady(true);
        }
      });
    } else {
      setSupabase(anonSupabase);
      setIsReady(true);
    }
    
    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, getToken]);

  return { supabase, isReady };
}
