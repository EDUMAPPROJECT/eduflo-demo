import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EnrolledClassWithDetails {
  id: string;
  class_id: string;
  created_at: string;
  class?: {
    id: string;
    name: string;
    schedule: string | null;
    target_grade: string | null;
    fee: number | null;
    is_recruiting: boolean | null;
    academy?: {
      id: string;
      name: string;
    };
  };
}

// Color palette for different classes in timetable
export const CLASS_COLORS = [
  { bg: "bg-blue-500", text: "text-white", light: "bg-blue-100", border: "border-blue-500" },
  { bg: "bg-green-500", text: "text-white", light: "bg-green-100", border: "border-green-500" },
  { bg: "bg-purple-500", text: "text-white", light: "bg-purple-100", border: "border-purple-500" },
  { bg: "bg-orange-500", text: "text-white", light: "bg-orange-100", border: "border-orange-500" },
  { bg: "bg-pink-500", text: "text-white", light: "bg-pink-100", border: "border-pink-500" },
  { bg: "bg-cyan-500", text: "text-white", light: "bg-cyan-100", border: "border-cyan-500" },
  { bg: "bg-yellow-500", text: "text-black", light: "bg-yellow-100", border: "border-yellow-500" },
  { bg: "bg-red-500", text: "text-white", light: "bg-red-100", border: "border-red-500" },
];

export interface ParsedSchedule {
  days: string[];
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

// Parse schedule string like "월/수/금 18:00~22:00" or "화/목 17:00~20:00"
export function parseSchedule(schedule: string | null): ParsedSchedule | null {
  if (!schedule) return null;
  
  // Match pattern: 요일들 시간~시간
  const match = schedule.match(/([월화수목금토일\/]+)\s*(\d{1,2}):(\d{2})\s*[~\-]\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const dayString = match[1];
  const startHour = parseInt(match[2], 10);
  const startMinute = parseInt(match[3], 10);
  const endHour = parseInt(match[4], 10);
  const endMinute = parseInt(match[5], 10);

  // Split days by "/" or just individual characters
  const days = dayString.includes("/") 
    ? dayString.split("/").filter(Boolean)
    : dayString.split("").filter(d => ["월", "화", "수", "목", "금", "토", "일"].includes(d));

  return { days, startHour, startMinute, endHour, endMinute };
}

export function useClassEnrollments() {
  const [enrollments, setEnrollments] = useState<EnrolledClassWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("class_enrollments")
        .select(`
          *,
          class:classes (
            id,
            name,
            schedule,
            target_grade,
            fee,
            is_recruiting,
            academy:academies (
              id,
              name
            )
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching enrollments:", error);
      } else {
        setEnrollments((data as any) || []);
      }
      setLoading(false);
    };

    fetchEnrollments();
  }, []);

  const checkEnrollment = async (classId: string): Promise<boolean> => {
    if (!userId) return false;
    
    const { data } = await supabase
      .from("class_enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("class_id", classId)
      .maybeSingle();
    
    return !!data;
  };

  const enrollClass = async (classId: string): Promise<boolean> => {
    if (!userId) return false;

    const { error } = await supabase
      .from("class_enrollments")
      .insert({
        user_id: userId,
        class_id: classId,
      });

    if (error) {
      console.error("Error enrolling class:", error);
      return false;
    }

    // Refresh enrollments
    const { data } = await supabase
      .from("class_enrollments")
      .select(`
        *,
        class:classes (
          id,
          name,
          schedule,
          target_grade,
          fee,
          is_recruiting,
          academy:academies (
            id,
            name
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    setEnrollments((data as any) || []);
    return true;
  };

  const unenrollClass = async (classId: string): Promise<boolean> => {
    if (!userId) return false;

    const { error } = await supabase
      .from("class_enrollments")
      .delete()
      .eq("user_id", userId)
      .eq("class_id", classId);

    if (error) {
      console.error("Error unenrolling class:", error);
      return false;
    }

    setEnrollments(prev => prev.filter(e => e.class_id !== classId));
    return true;
  };

  return {
    enrollments,
    loading,
    userId,
    checkEnrollment,
    enrollClass,
    unenrollClass,
  };
}
