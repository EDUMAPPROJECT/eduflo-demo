import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GraduationCap, Phone, Calendar, User } from "lucide-react";
import type { SurveyField, SurveyAnswer } from "@/types/surveyField";

interface Application {
  id: string;
  student_name: string;
  student_grade: string | null;
  attendee_count: number | null;
  message: string | null;
  custom_answers: Record<string, any> | null;
  created_at: string;
  user_id: string;
  profile?: {
    phone: string | null;
    user_name: string | null;
  };
}

interface SeminarInfo {
  id: string;
  title: string;
  survey_fields: SurveyField[] | null;
}

const SeminarApplicantsPage = () => {
  const { seminarId } = useParams<{ seminarId: string }>();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [seminar, setSeminar] = useState<SeminarInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (seminarId) {
      fetchData();
    }
  }, [seminarId]);

  const fetchData = async () => {
    try {
      // Fetch seminar info
      const { data: seminarData } = await supabase
        .from("seminars")
        .select("id, title, survey_fields")
        .eq("id", seminarId)
        .maybeSingle();

      if (seminarData) {
        setSeminar({
          ...seminarData,
          survey_fields: Array.isArray(seminarData.survey_fields) ? seminarData.survey_fields as any : null,
        });
      }

      // Fetch applications
      const { data, error } = await supabase
        .from("seminar_applications")
        .select("*")
        .eq("seminar_id", seminarId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map((app) => app.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, phone, user_name")
          .in("id", userIds);

        const appsWithProfiles = data.map((app) => ({
          ...app,
          profile: profiles?.find((p) => p.id === app.user_id),
        }));

        setApplications(appsWithProfiles as Application[]);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error("Error fetching applicants:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSurveyFieldLabel = (fieldId: string): string => {
    if (!seminar?.survey_fields) return fieldId;
    const field = seminar.survey_fields.find((f) => f.id === fieldId);
    return field?.label || field?.consentText || fieldId;
  };

  const renderAnswerValue = (value: any): string => {
    if (typeof value === "object" && value !== null && "value" in value) {
      const v = value.value;
      if (Array.isArray(v)) return v.join(", ");
      if (typeof v === "boolean") return v ? "동의" : "미동의";
      return String(v);
    }
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "boolean") return value ? "동의" : "미동의";
    return String(value);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">신청자 명단</h1>
            {seminar && (
              <p className="text-xs text-muted-foreground truncate">{seminar.title}</p>
            )}
          </div>
          <Badge variant="secondary">{applications.length}명</Badge>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">신청자가 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app, index) => {
              const parentPhone = app.custom_answers?._parentPhone;
              const surveyAnswers = app.custom_answers
                ? Object.entries(app.custom_answers).filter(([key]) => !key.startsWith("_"))
                : [];

              return (
                <Card key={app.id}>
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{app.student_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(app.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-1.5 mb-3">
                      {parentPhone && (
                        <p className="text-sm text-foreground flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          {parentPhone}
                        </p>
                      )}
                      {app.profile?.phone && !parentPhone && (
                        <p className="text-sm text-foreground flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          {app.profile.phone}
                        </p>
                      )}
                      {app.profile?.user_name && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <User className="w-3.5 h-3.5" />
                          계정: {app.profile.user_name}
                        </p>
                      )}
                    </div>

                    {/* Survey answers */}
                    {surveyAnswers.length > 0 && (
                      <div className="space-y-2 border-t border-border pt-3">
                        {surveyAnswers.map(([key, value], idx) => (
                          <div key={idx} className="text-sm">
                            <p className="text-muted-foreground text-xs font-medium mb-0.5">
                              {getSurveyFieldLabel(key)}
                            </p>
                            <p className="text-foreground whitespace-pre-wrap">
                              {renderAnswerValue(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Legacy fields */}
                    {app.message && (
                      <div className="border-t border-border pt-3 mt-3">
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">메시지</p>
                        <p className="text-sm text-foreground">{app.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SeminarApplicantsPage;
