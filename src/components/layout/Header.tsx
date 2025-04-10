
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

interface HeaderProps {
  user: User | null;
}

const Header = ({ user }: HeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-sm border-b border-natural-200 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-natural-600" />
          <span className="text-2xl font-semibold text-natural-800 bg-gradient-to-r from-natural-600 to-natural-800 bg-clip-text text-transparent">
            Nature Snoop
          </span>
        </div>
        <div className="space-x-4">
          {user ? (
            <Button
              variant="ghost"
              className="text-natural-800 hover:text-natural-600"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-natural-800 hover:text-natural-600"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button
                className="bg-natural-600 hover:bg-natural-700 text-white"
                onClick={() => navigate("/login?view=sign_up")}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
