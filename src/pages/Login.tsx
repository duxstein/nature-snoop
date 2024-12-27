import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        toast.success('Successfully signed in!');
        navigate("/");
      }
      if (event === 'SIGNED_OUT') {
        toast.success('Successfully signed out!');
        navigate("/login");
      }
      if (event === 'USER_UPDATED') {
        toast.success('Account updated successfully!');
      }
      if (event === 'PASSWORD_RECOVERY') {
        toast.info('Check your email for password reset instructions');
      }
    });

    // Handle auth state errors
    const {
      data: { subscription: errorSubscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'USER_DELETED' as any) {
        toast.error('Account has been deleted');
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
      errorSubscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-natural-50 to-natural-100 flex items-center justify-center p-4">
      <Card className="w-[400px] p-6 bg-white/80 backdrop-blur-sm">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#22c55e',
                  brandAccent: '#16a34a',
                }
              }
            }
          }}
          theme="light"
          providers={["google", "github"]}
          redirectTo={window.location.origin}
          localization={{
            variables: {
              sign_up: {
                password_label: 'Password (minimum 6 characters)',
                password_input_placeholder: 'Enter a password (min. 6 characters)',
                email_input_placeholder: 'Your email address',
                button_label: 'Sign up',
                loading_button_label: 'Creating account...',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: "Don't have an account? Sign up",
              },
              sign_in: {
                password_label: 'Your password',
                email_input_placeholder: 'Your email address',
                button_label: 'Sign in',
                loading_button_label: 'Signing in...',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: 'Already have an account? Sign in',
              },
            },
          }}
        />
      </Card>
    </div>
  );
};

export default Login;