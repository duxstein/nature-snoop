
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { isValidEmail } from "@/utils/validation";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Clear email error when email changes
  useEffect(() => {
    if (email) {
      if (!isValidEmail(email)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }
  }, [email]);

  // Handle email input capture for validation
  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  // Handle password input capture for strength meter
  const handlePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

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
            },
            extend: true,
          }}
          theme="light"
          providers={[]}
          redirectTo={`${window.location.origin}/`}
          showLinks={true}
          view="sign_up"
          localization={{
            variables: {
              sign_up: {
                password_label: 'Password (minimum 6 characters)',
                password_input_placeholder: 'Enter a password (min. 6 characters)',
                email_input_placeholder: 'Your email address',
                button_label: 'Sign up',
                loading_button_label: 'Creating account...',
                social_provider_text: 'Sign up with {{provider}}',
                link_text: 'Already have an account? Sign in',
              }
            }
          }}
          onInputChange={(e) => {
            // Type assertion since we know the target is an input element
            const target = e.target as HTMLInputElement;
            
            if (target.name === 'email') {
              handleEmailInput(e as React.ChangeEvent<HTMLInputElement>);
            } else if (target.name === 'password') {
              handlePasswordInput(e as React.ChangeEvent<HTMLInputElement>);
            }
          }}
        />
        
        {/* Email error message */}
        {emailError && (
          <div className="mt-2 text-red-500 text-sm">{emailError}</div>
        )}
        
        {/* Password strength meter - only show when password field has input */}
        {password && <PasswordStrengthMeter password={password} />}
      </Card>
    </div>
  );
};

export default Signup;
