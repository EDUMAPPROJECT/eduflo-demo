import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Announcement {
  id: string;
  title: string;
  content: string;
}

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('id, title, content')
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const visibleAnnouncements = announcements.filter(a => !dismissed.has(a.id));

  if (loading || visibleAnnouncements.length === 0) {
    return null;
  }

  const currentAnnouncement = visibleAnnouncements[currentIndex % visibleAnnouncements.length];

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDismissed(prev => new Set([...prev, id]));
    if (currentIndex >= visibleAnnouncements.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => 
      prev === 0 ? visibleAnnouncements.length - 1 : prev - 1
    );
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => 
      (prev + 1) % visibleAnnouncements.length
    );
  };

  return (
    <>
      <div 
        className="bg-primary/10 border border-primary/20 rounded-xl p-3 relative cursor-pointer hover:bg-primary/15 transition-colors"
        onClick={() => setSelectedAnnouncement(currentAnnouncement)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-3.5 h-3.5 text-primary" />
          </div>
          <h4 className="font-medium text-foreground text-sm flex-1 truncate">
            {currentAnnouncement.title}
          </h4>
          {visibleAnnouncements.length > 1 && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="w-5 h-5"
                onClick={handlePrev}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <span className="text-[10px] text-muted-foreground min-w-[24px] text-center">
                {(currentIndex % visibleAnnouncements.length) + 1}/{visibleAnnouncements.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="w-5 h-5"
                onClick={handleNext}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5 flex-shrink-0"
            onClick={(e) => handleDismiss(e, currentAnnouncement.id)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              {selectedAnnouncement?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {selectedAnnouncement?.content}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AnnouncementBanner;
