'use client';

import { supabase } from '@/lib/supabase';
import React from 'react';


const DashboardPage = () => {
  

  return (
    <div>
      <button onClick={() => {
        supabase.auth.signOut();
      }}>
        Sign Out
      </button>
    </div>
  );
};

export default DashboardPage;