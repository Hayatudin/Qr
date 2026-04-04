import React, { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare, Plus, Star, Trash2, Edit, X } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Updated Service type
interface Service {
  id: number;
  name_en: string;
  name_am: string;
  name_om: string;
  description_en: string;
  description_am: string;
  description_om: string;
  price: string;
  type: string;
  image_url: string;
}

interface Feedback {
  id: number;
  comment: string;
  rating: number;
  created_at: string;
  category: string;
  username: string | null;
  service_name: string | null;
}

const AdminPanel = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState("services");
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const initialFormData = { name_en: "", description_en: "", name_am: "", description_am: "", name_om: "", description_om: "", price: "", type: "food" };
  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error("Access Denied: You are not an administrator.");
      navigate('/');
    }
  }, [user, navigate]);


  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/services.php");
      if (!res.ok) throw new Error("Failed to fetch services data.");
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      setServices(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };
  
  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    setFeedbackError("");
    try {
      const res = await fetch("http://localhost:8000/api/feedback.php");
      if (!res.ok) throw new Error("Could not fetch feedback.");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFeedback(data);
    } catch (e: any) {
      setFeedbackError(e.message);
    }
    setFeedbackLoading(false);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'services') {
        fetchServices();
      } else if (activeTab === 'feedback') {
        fetchFeedback();
      }
    }
  }, [activeTab, user]);

  const openAddForm = () => {
    setEditingService(null);
    setFormData(initialFormData);
    setImageFile(null);
    setIsFormOpen(true);
  };

  const openEditForm = (service: Service) => {
    setEditingService(service);
    setFormData({
      name_en: service.name_en,
      description_en: service.description_en,
      name_am: service.name_am,
      description_am: service.description_am,
      name_om: service.name_om,
      description_om: service.description_om,
      price: service.price,
      type: service.type,
    });
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
    });
    
    if (imageFile) {
      data.append('image', imageFile);
    }

    const endpoint = "http://localhost:8000/api/services.php";
    
    if (editingService) {
        data.append('id', String(editingService.id));
    }

    const promise = fetch(endpoint, { method: "POST", body: data });

    toast.promise(promise, {
      loading: `${editingService ? 'Updating' : 'Adding'} service...`,
      success: (res: any) => {
          fetchServices();
          setIsFormOpen(false);
          return `Service ${editingService ? 'updated' : 'added'} successfully!`;
      },
      error: 'Failed to save service.',
    });
  };

  const handleDelete = async (serviceId: number) => {
    try {
      const response = await fetch("http://localhost:8000/api/services.php", {
        method: "DELETE",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: serviceId }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Service deleted successfully!");
        setServices(services.filter(s => s.id !== serviceId));
      } else {
        toast.error(result.error || "Failed to delete service.");
      }
    } catch (error) {
      toast.error("Error deleting service.");
    }
  };

  const formTitle = useMemo(() => editingService ? t('admin.form_edit_title') : t('admin.form_add_title'), [editingService, t]);

  const renderServicesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {t('admin.manage_services')}
        </h2>
        <Button onClick={openAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.add_service')}
        </Button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">{t('admin.current_services')}</h3>
        {loading && <div>{t('messages.loading')}</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && (
          <ul className="space-y-3">
            {services.map((service) => (
              <li key={service.id} className="bg-card border p-3 rounded-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <img 
                    src={service.image_url ? `http://localhost:8000/${service.image_url}` : '/placeholder.svg'} 
                    alt={service.name_en} 
                    className="w-20 h-20 object-cover rounded-md"
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                  />
                  <div className="flex-1">
                    <p className="font-bold">{service.name_en}</p>
                    <p className="text-sm text-muted-foreground capitalize">{service.type}</p>
                    <p className="text-sm font-medium text-golden">{t('product.price', {price: service.price})}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEditForm(service)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('admin.delete_dialog_title')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('admin.delete_dialog_description', { name: service.name_en })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(service.id)}>{t('admin.delete')}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{formTitle}</DialogTitle>
                <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                {/* English Fields */}
                <div className="space-y-2">
                    <Label>English</Label>
                    <Input placeholder="Service Name (EN)" value={formData.name_en} onChange={(e) => handleInputChange("name_en", e.target.value)} required />
                    <Textarea placeholder="Description (EN)" value={formData.description_en} onChange={(e) => handleInputChange("description_en", e.target.value)} />
                </div>
                 {/* Amharic Fields */}
                <div className="space-y-2">
                    <Label>Amharic</Label>
                    <Input placeholder="የአገልግሎት ስም (AM)" value={formData.name_am} onChange={(e) => handleInputChange("name_am", e.target.value)} />
                    <Textarea placeholder="መግለጫ (AM)" value={formData.description_am} onChange={(e) => handleInputChange("description_am", e.target.value)} />
                </div>
                {/* Oromo Fields */}
                <div className="space-y-2">
                    <Label>Afaan Oromoo</Label>
                    <Input placeholder="Maqaa Tajaajilaa (OM)" value={formData.name_om} onChange={(e) => handleInputChange("name_om", e.target.value)} />
                    <Textarea placeholder="Ibsa (OM)" value={formData.description_om} onChange={(e) => handleInputChange("description_om", e.target.value)} />
                </div>
                
                <hr/>

                <Input type="number" placeholder={t('admin.form_price')} value={formData.price} onChange={(e) => handleInputChange("price", e.target.value)} required />
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">{t('categories.food')}</SelectItem>
                    <SelectItem value="drink">{t('categories.drink')}</SelectItem>
                    <SelectItem value="room">{t('categories.room')}</SelectItem>
                    <SelectItem value="spa">Spa</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <Label>{t('admin.form_image')}</Label>
                  {editingService?.image_url && !imageFile && <img src={`http://localhost:8000/${editingService.image_url}`} alt="Current" className="w-24 h-24 object-cover rounded-md my-2"/>}
                  <Input type="file" accept="image/*" onChange={handleFileChange} />
                </div>
                <DialogFooter>
                    <Button type="submit">{editingService ? t('admin.form_save_button') : t('admin.add_service')}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderFeedbackTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{t('admin.user_feedback')}</h2>
        <span className="text-sm text-muted-foreground">{t('admin.reviews', {count: feedback.length})}</span>
      </div>
      {feedbackLoading && <p>{t('messages.loading')}</p>}
      {feedbackError && <p className="text-destructive">{feedbackError}</p>}
      {!feedbackLoading && !feedbackError && feedback.length === 0 && (
        <div className="bg-card p-12 rounded-lg border text-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('admin.no_feedback_title')}</h3>
          <p className="text-muted-foreground">{t('admin.no_feedback_description')}</p>
        </div>
      )}
      <div className="space-y-4">
        {feedback.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">
                    {t('admin.feedback_on', { category: item.service_name || item.category })}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground pt-1">
                    {t('admin.feedback_by', { user: item.username || t('admin.anonymous') })}
                  </p>
                  <p className="text-xs text-muted-foreground pt-1">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <span className="font-bold">{item.rating}</span>
                  <Star className="h-4 w-4 fill-current" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{item.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (user?.role !== 'admin') {
    return (
        <div className="bg-background flex max-w-[480px] w-full flex-col items-center justify-center mx-auto min-h-screen">
            <p>{t('messages.loading')}</p>
        </div>
    )
  }

  return (
    <div className="bg-background flex max-w-[480px] w-full flex-col overflow-hidden items-center mx-auto pt-4 min-h-screen">
      <Header />
      <main className="flex flex-col w-full flex-1 px-6 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">{t('admin.title')}</h1>
          <div className="bg-golden/20 text-golden px-3 py-1 rounded-full text-sm font-medium">
            {t('settings.admin_badge')}
          </div>
        </div>
        <div className="flex bg-muted rounded-lg p-1 mb-6">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "services"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("services")}
          >
            {t('admin.services_tab')}
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "feedback"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("feedback")}
          >
            {t('admin.feedback_tab')}
          </button>
        </div>
        {activeTab === "services" ? renderServicesTab() : renderFeedbackTab()}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default AdminPanel;