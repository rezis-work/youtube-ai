import { supabase } from "./supabaseClient";

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin, // Redirect back after login
    },
  });

  if (error) console.error("Google Login Error:", error);
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Sign Out Error:", error);
};

export const getUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user;
};
