
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { isValidEmail, checkPasswordStrength } from "@/utils/validation";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

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

  // Toggle between default Supabase UI and custom form
  const toggleForm = () => {
    setShowCustomForm(!showCustomForm);
  };

  // Handle custom signup
  const handleCustomSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
      } else if (data) {
        toast.success("Signup successful! Check your email for a confirmation link.");
        navigate("/");
      }
    } catch (error) {
      toast.error("An error occurred during signup.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-natural-50 to-natural-100 flex items-center justify-center p-4">
      <Card className="w-[400px] p-6 bg-white/80 backdrop-blur-sm">
        {!showCustomForm ? (
          <>
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
            />
            <div className="mt-4 text-center">
              <button
                className="text-green-600 hover:text-green-800 text-sm font-medium"
                onClick={toggleForm}
              >
                Want to check password strength? Try our custom form.
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>
            <form onSubmit={handleCustomSignup} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter a password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
                {password && <PasswordStrengthMeter password={password} />}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={!isValidEmail(email) || !password || password.length < 6}
              >
                Sign up
              </Button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                  onClick={toggleForm}
                >
                  Back to standard signup
                </button>
              </div>
            </form>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/login" className="text-green-600 hover:text-green-800 font-medium">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Signup;
