import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Leaf, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login failed");

      login(data, data.token);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Left side: branding/imagery */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 p-10 text-white relative overflow-hidden">
        {/* Dynamic Abstract Background inside container */}
        <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-green-500/30 blur-[150px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/20 blur-[120px]" />
            <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-teal-500/20 blur-[100px]" />
        </div>
        
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
            <img src="/logo.jpg" alt="Scope Zero Logo" className="h-full w-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
          </div>
          <span className="text-xl font-bold tracking-tight">Scope Zero</span>
        </div>
        
        <div className="relative z-10 space-y-6 max-w-lg mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Welcome back to <span className="text-green-400">sustainability.</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Gain deep insights into your operations. Discover critical hotspots, utilize real-time live APIs, and track your decarbonization journey.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex items-center gap-3 rounded-lg bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
                <div className="p-2 rounded-md bg-green-500/20 text-green-400"><Leaf size={20} /></div>
                <div className="text-sm font-medium">Smart AI Audit</div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
                <div className="p-2 rounded-md bg-teal-500/20 text-teal-400"><Globe size={20} /></div>
                <div className="text-sm font-medium">Scope 1, 2 & 3</div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-zinc-500">
          © {new Date().getFullYear()} Scope Zero. All rights reserved.
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex items-center justify-center p-8 bg-background relative selection:bg-green-500/30">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>
        <div className="mx-auto w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Sign In</h2>
            <p className="text-muted-foreground">
              Enter your credentials to access your carbon dashboard
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  className="transition-shadow focus-visible:ring-green-500/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {/* Keep for future forgot password feature */}
                  <Link to="#" className="text-xs text-green-600 hover:text-green-500 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="transition-shadow focus-visible:ring-green-500/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-6 shadow-lg shadow-green-600/20 transition-all hover:shadow-green-600/40" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>
          
          <div className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-green-600 hover:text-green-500 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
