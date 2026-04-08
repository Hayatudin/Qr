import React, { useState } from 'react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ChevronRight, Moon, Globe, DollarSign, Info, Settings as SettingsIcon, LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

const Profile = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, setUser } = useUser();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const handleAdminPanelClick = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else {
      toast.error("You must be an administrator to access this page.");
    }
  };

  const clearForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      clearForm();
      setAuthMode('login');
    }
    setIsAuthDialogOpen(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      handleSignIn();
    } else {
      handleRegister();
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/api/users.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
        toast.success(`Welcome back, ${data.user.username}!`);
        handleOpenChange(false);
      } else {
        toast.error(data.error || "Login failed.");
      }
    } catch (err) {
      toast.error("An error occurred during login.");
    }
  };

  const handleRegister = async () => {
    if (!email || !username || !password) {
      toast.error("Please fill all fields for registration.");
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/api/users.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
        toast.success(`Account created! Welcome, ${data.user.username}!`);
        handleOpenChange(false);
      } else {
        toast.error(data.error || "Registration failed.");
      }
    } catch (err) {
      toast.error("An error occurred during registration.");
    }
  };

  const handleSignOut = () => {
    setUser(null);
    toast.info("You have been signed out.");
  };

  return (
    <div className="bg-background flex max-w-[480px] w-full flex-col overflow-hidden mx-auto min-h-screen pb-28">
      <main className="flex flex-col w-full flex-1 px-5 pt-14">
        {/* Page title */}
        <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

        {/* User card */}
        <div className="bg-card rounded-2xl p-4 flex items-center gap-4 border border-border/50 mb-6">
          {user ? (
            <>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ background: '#2d6a4f' }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                {user.role === 'admin' && (
                  <span className="mt-1 inline-block bg-golden/20 text-golden px-2 py-0.5 rounded-full text-[10px] font-medium">
                    Administrator
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="shrink-0 text-xs rounded-full border-border"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ background: '#2d6a4f' }}
              >
                G
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Guest</p>
                <p className="text-xs text-muted-foreground">Become Our customer by creating account</p>
              </div>
              <Dialog open={isAuthDialogOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="shrink-0 text-xs rounded-full bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => setIsAuthDialogOpen(true)}
                  >
                    Sign in/Register
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>{authMode === 'login' ? t('settings.dialog.login_title') : t('settings.dialog.register_title')}</DialogTitle>
                    <DialogDescription>
                      {authMode === 'login' ? t('settings.dialog.login_description') : t('settings.dialog.register_description')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      {authMode === 'register' && (
                        <Input
                          id="username"
                          type="text"
                          placeholder={t('settings.dialog.username_placeholder')}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="rounded-xl"
                        />
                      )}
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('settings.dialog.email_placeholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded-xl"
                      />
                      <Input
                        id="password"
                        type="password"
                        placeholder={t('settings.dialog.password_placeholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <DialogFooter className="flex-col gap-2">
                      <Button type="submit" className="w-full rounded-xl">{authMode === 'login' ? t('settings.dialog.login_title') : t('settings.dialog.register_button')}</Button>
                      <Button type="button" variant="link" size="sm" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                        {authMode === 'login' ? t('settings.dialog.login_switch') : t('settings.dialog.register_switch')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        {/* Preferences section */}
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Preferences</h2>
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden mb-5">
          {/* Dark Mode toggle */}
          <div className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Moon className="h-4 w-4 text-foreground" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground">Dark Mode</span>
            <button
              onClick={toggleTheme}
              className={`ios-toggle ${theme === 'dark' ? 'active' : ''}`}
              aria-label="Toggle dark mode"
            />
          </div>

          <div className="h-px bg-border mx-4" />

          {/* Language */}
          <button 
            onClick={() => navigate('/settings/language')}
            className="flex items-center gap-4 px-4 py-3.5 w-full hover:bg-accent/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Globe className="h-4 w-4 text-foreground" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground text-left">Language</span>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-muted-foreground uppercase">{i18n.language}</span>
               <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>

          <div className="h-px bg-border mx-4" />

          {/* Currency */}
          <button 
            onClick={() => navigate('/settings/currency')}
            className="flex items-center gap-4 px-4 py-3.5 w-full hover:bg-accent/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-foreground" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground text-left">Currency</span>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-muted-foreground uppercase">{currency}</span>
               <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden mb-5">
          <button 
            onClick={() => navigate('/settings/about')}
            className="flex items-center gap-4 px-4 py-3.5 w-full hover:bg-accent/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Info className="h-4 w-4 text-foreground" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground text-left">About Us</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Admin Panel (only for admins) */}
        {user?.role === 'admin' && (
          <div className="mb-5 scale-in">
            <h2 className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest px-1">Administrative</h2>
            <div 
              className="group flex items-center justify-between bg-card p-3.5 rounded-2xl border border-golden/20 cursor-pointer hover:bg-golden/5 transition-all active:scale-[0.98] shadow-sm"
              onClick={handleAdminPanelClick}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-golden/10 flex items-center justify-center text-golden group-hover:scale-110 transition-transform">
                  <SettingsIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Admin Panel</h3>
                  <p className="text-[10px] text-muted-foreground">Manage products & orders</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
