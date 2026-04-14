import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Leaf, Globe, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords mismatch",
        description: "Please ensure both password fields match exactly.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Registration failed");

      login(data, data.token);
      toast({ title: "Account created!", description: "Welcome to Scope Zero." });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
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
            Pioneer a <span className="text-green-400">greener future.</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Join thousands of organizations using Scope Zero to effortlessly measure, analyze, and optimize their carbon footprint with AI-driven insights.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex items-center gap-3 rounded-lg bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
                <div className="p-2 rounded-md bg-green-500/20 text-green-400"><Leaf size={20} /></div>
                <div className="text-sm font-medium">Real-time Analytics</div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
                <div className="p-2 rounded-md bg-teal-500/20 text-teal-400"><Globe size={20} /></div>
                <div className="text-sm font-medium">Global Emissions</div>
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
            <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
            <p className="text-muted-foreground">
              Enter your information below to get started
            </p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="pl-3 transition-shadow focus-visible:ring-green-500/50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="transition-shadow focus-visible:ring-green-500/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="transition-shadow focus-visible:ring-green-500/50"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
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
                <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>
          
          <div className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-green-600 hover:text-green-500 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
