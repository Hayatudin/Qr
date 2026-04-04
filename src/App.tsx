import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Feedback from "./pages/Feedback";
import Favorites from "./pages/Favorites";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";

const App = () => (
  <ThemeProvider>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </ThemeProvider>
);

export default App;
