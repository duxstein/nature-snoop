import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";

const Signup = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-natural-50 to-natural-100 flex items-center justify-center p-4">
      <Card className="w-[400px] p-6 bg-white/80 backdrop-blur-sm">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={["google", "github"]}
          redirectTo={`${window.location.origin}/`}
          showLinks={false}
          view="sign_up"
          additionalData={{
            email_confirm: false
          }}
          localization={{
            variables: {
              sign_up: {
                password_label: 'Password (minimum 6 characters)',
                password_input_placeholder: 'Enter a password (min. 6 characters)'
              }
            }
          }}
        />
      </Card>
    </div>
  );
};

export default Signup;