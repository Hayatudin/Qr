import React, { useState, useEffect } from 'react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageCircle } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ServiceOption {
  id: number;
  name_en: string;
  name_am: string;
  name_om: string;
}

const Feedback = () => {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServicesForDropdown = async () => {
      setIsLoadingServices(true);
      try {
        const res = await fetch('http://localhost:8000/api/services.php');
        const data = await res.json();
        if (data.error) {
          toast.error("Could not load services for feedback form.");
        } else {
          setServices(data);
        }
      } catch (err) {
        toast.error("Failed to fetch services list.");
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServicesForDropdown();
  }, []);

  const getTranslatedName = (service: ServiceOption) => {
    const lang = i18n.language;
    if (lang === 'am' && service.name_am) return service.name_am;
    if (lang === 'om' && service.name_om) return service.name_om;
    return service.name_en;
  };

  const handleSubmit = async () => {
    if (!selectedServiceId || rating === 0 || !comment.trim()) {
      toast.error("Please select a category, rating, and write a comment.");
      return;
    }

    const selectedService = services.find(s => String(s.id) === selectedServiceId);

    const payload = {
      user_id: user ? user.id : null,
      service_id: selectedServiceId === 'general' ? null : parseInt(selectedServiceId, 10),
      category: selectedService ? getTranslatedName(selectedService) : 'General',
      comment: comment,
      rating: rating,
    };

    try {
      const response = await fetch('http://localhost:8000/api/feedback.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Thank you for your feedback!");
        navigate('/');
      } else {
        toast.error(result.error || "Failed to submit feedback.");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="bg-background flex max-w-[480px] w-full flex-col overflow-hidden mx-auto min-h-screen pb-28">
      <main className="flex flex-col w-full flex-1 px-5 pt-14">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-golden/15 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-golden" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{t('feedback.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('feedback.description')}</p>
        </div>

        {/* Form sections */}
        <div className="space-y-5">
          {/* Service selector */}
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{t('feedback.service_label')}</label>
            <Select value={selectedServiceId ?? ''} onValueChange={setSelectedServiceId} disabled={isLoadingServices}>
              <SelectTrigger className="rounded-xl border-border bg-background">
                <SelectValue placeholder={t('feedback.service_placeholder')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="general">{t('feedback.general_feedback')}</SelectItem>
                <SelectSeparator />
                {services.map(service => (
                  <SelectItem key={service.id} value={String(service.id)}>
                    {getTranslatedName(service)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Star rating */}
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('feedback.rating_label')}</label>
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`h-9 w-9 transition-colors duration-200 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-border'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <span className="text-xs font-medium text-golden mt-1 animate-in fade-in duration-200">
                  {ratingLabels[rating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{t('feedback.comment_label')}</label>
            <Textarea
              placeholder={t('feedback.comment_placeholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px] resize-none rounded-xl border-border bg-background"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            className="w-full h-12 rounded-2xl text-sm font-semibold bg-foreground hover:bg-foreground/90 text-background shadow-lg transition-all duration-200 hover:shadow-xl"
            disabled={!selectedServiceId || rating === 0 || !comment.trim()}
          >
            {t('feedback.submit_button')}
          </Button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Feedback;