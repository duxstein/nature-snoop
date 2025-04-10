
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Leaf, TreeDeciduous, Sprout } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const searchParams = new URLSearchParams(location.search);
  const initialView = searchParams.get('view') || 'sign_in';

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
      if (event === 'PASSWORD_RESET' as any) {
        toast.success('Password has been reset successfully!');
        navigate("/");
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

  // Simpler animations for mobile
  const getInitialProps = () => {
    return isMobile 
      ? { opacity: 0 }
      : { opacity: 0, y: 20 };
  };

  const getAnimateProps = () => {
    return isMobile
      ? { opacity: 1 }
      : { opacity: 1, y: 0 };
  };

  const staggerDelay = 0.1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-natural-50 via-white to-natural-100 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-natural-100 rounded-full -mt-20 -mr-20 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-natural-200 rounded-full -mb-48 -ml-48 opacity-30"></div>
      
      {/* Plant decorations - hidden on mobile */}
      {!isMobile && (
        <>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute top-20 left-20 text-natural-600 hidden md:block"
          >
            <TreeDeciduous size={48} />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="absolute bottom-20 right-20 text-natural-700 hidden md:block"
          >
            <Sprout size={36} />
          </motion.div>
        </>
      )}

      <motion.div
        initial={getInitialProps()}
        animate={getAnimateProps()}
        transition={{ duration: 0.6 }}
        className="z-10 w-full max-w-md"
      >
        <motion.div 
          initial={getInitialProps()}
          animate={getAnimateProps()}
          transition={{ delay: staggerDelay, duration: 0.6 }}
          className="flex justify-center mb-6"
        >
          <div className="flex items-center gap-2 py-2 px-4 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
            <Leaf className="h-6 w-6 text-natural-600" />
            <span className="text-2xl font-semibold text-natural-800 bg-gradient-to-r from-natural-600 to-natural-800 bg-clip-text text-transparent">
              Nature Snoop
            </span>
          </div>
        </motion.div>

        <Card className="w-full p-6 bg-white/90 backdrop-blur-sm border-natural-200 shadow-lg">
          <CardContent className="p-0">
            <motion.div 
              initial={getInitialProps()}
              animate={getAnimateProps()}
              transition={{ delay: staggerDelay * 3, duration: 0.6 }}
            >
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#6DBB51',
                        brandAccent: '#569641',
                        inputText: '#294B20',
                        inputBackground: '#FFFFFF',
                        inputBorder: '#E3F4D7',
                        inputBorderFocus: '#8BCA73',
                        inputBorderHover: '#C7E6B9',
                        inputPlaceholder: '#A9D896',
                      },
                      fonts: {
                        bodyFontFamily: 'Inter, system-ui, sans-serif',
                        buttonFontFamily: 'Inter, system-ui, sans-serif',
                        inputFontFamily: 'Inter, system-ui, sans-serif',
                        labelFontFamily: 'Inter, system-ui, sans-serif',
                      },
                      borderWidths: {
                        buttonBorderWidth: '1px',
                        inputBorderWidth: '1px',
                      },
                      radii: {
                        borderRadiusButton: '0.5rem',
                        buttonBorderRadius: '0.5rem',
                        inputBorderRadius: '0.5rem',
                      },
                    },
                  },
                  extend: true,
                  className: {
                    button: 'py-3 font-medium transition-all duration-200',
                    input: 'bg-natural-50/50',
                    label: 'text-natural-700 font-medium',
                  },
                }}
                theme="light"
                providers={[]}
                redirectTo={window.location.origin}
                view={initialView as any}
                localization={{
                  variables: {
                    sign_in: {
                      password_label: 'Your password',
                      email_input_placeholder: 'Your email address',
                      button_label: 'Sign in',
                      loading_button_label: 'Signing in...',
                      social_provider_text: 'Sign in with {{provider}}',
                      link_text: "Don't have an account? Sign up",
                    },
                    sign_up: {
                      password_label: 'Create a password',
                      email_input_placeholder: 'Your email address',
                      button_label: 'Sign up',
                      loading_button_label: 'Signing up...',
                      social_provider_text: 'Sign up with {{provider}}',
                      link_text: "Already have an account? Sign in",
                      confirmation_text: "Check your email for the confirmation link",
                    },
                    forgotten_password: {
                      button_label: 'Send reset instructions',
                      loading_button_label: 'Sending reset instructions...',
                      link_text: 'Forgot your password?',
                      confirmation_text: 'Check your email for the password reset link',
                    },
                    update_password: {
                      button_label: 'Update password',
                      loading_button_label: 'Updating password...',
                      confirmation_text: 'Your password has been updated',
                    },
                  },
                }}
              />
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
