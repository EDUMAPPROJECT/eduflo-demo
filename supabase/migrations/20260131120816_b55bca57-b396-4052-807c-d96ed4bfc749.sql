-- =====================================================
-- Student Profiles & Parent-Child Relations 설계
-- 기존 children, child_connections 데이터를 새 구조로 마이그레이션
-- =====================================================

-- 1. student_profiles 테이블 생성 (핵심: user_id가 NULL이면 가상 프로필)
CREATE TABLE public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL이면 가상 프로필
    name TEXT NOT NULL,
    school_name TEXT,
    grade TEXT,
    propensity_data JSONB DEFAULT '{}'::jsonb,  -- 성향 테스트 결과
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. parent_child_relations 테이블 생성 (다대다 관계)
CREATE TABLE public.parent_child_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(parent_user_id, student_profile_id)
);

-- 3. connection_codes 테이블 생성 (학생이 발급, 부모가 입력)
CREATE TABLE public.connection_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    issuer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- 발급자 (학생)
    student_profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,  -- 연결된 프로필
    used_by_parent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- 사용한 부모
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. RLS 활성화
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_child_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_codes ENABLE ROW LEVEL SECURITY;

-- 5. student_profiles RLS 정책
CREATE POLICY "Users can view their own student profile"
    ON public.student_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Parents can view their children profiles"
    ON public.student_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.parent_child_relations
            WHERE parent_user_id = auth.uid()
            AND student_profile_id = student_profiles.id
        )
    );

CREATE POLICY "Parents can create student profiles (virtual children)"
    ON public.student_profiles FOR INSERT
    WITH CHECK (user_id IS NULL);  -- 가상 프로필만 직접 생성 가능

CREATE POLICY "Users can update their own student profile"
    ON public.student_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Parents can update their virtual children profiles"
    ON public.student_profiles FOR UPDATE
    USING (
        user_id IS NULL AND
        EXISTS (
            SELECT 1 FROM public.parent_child_relations
            WHERE parent_user_id = auth.uid()
            AND student_profile_id = student_profiles.id
        )
    );

CREATE POLICY "Parents can delete their virtual children profiles"
    ON public.student_profiles FOR DELETE
    USING (
        user_id IS NULL AND
        EXISTS (
            SELECT 1 FROM public.parent_child_relations
            WHERE parent_user_id = auth.uid()
            AND student_profile_id = student_profiles.id
        )
    );

-- 6. parent_child_relations RLS 정책
CREATE POLICY "Parents can view their relations"
    ON public.parent_child_relations FOR SELECT
    USING (auth.uid() = parent_user_id);

CREATE POLICY "Students can view relations to them"
    ON public.parent_child_relations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.student_profiles
            WHERE id = student_profile_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Parents can create relations for virtual profiles"
    ON public.parent_child_relations FOR INSERT
    WITH CHECK (
        auth.uid() = parent_user_id AND
        EXISTS (
            SELECT 1 FROM public.student_profiles
            WHERE id = student_profile_id AND user_id IS NULL
        )
    );

CREATE POLICY "System can create relations via code connection"
    ON public.parent_child_relations FOR INSERT
    WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY "Parents can delete relations to virtual profiles"
    ON public.parent_child_relations FOR DELETE
    USING (
        auth.uid() = parent_user_id AND
        EXISTS (
            SELECT 1 FROM public.student_profiles
            WHERE id = student_profile_id AND user_id IS NULL
        )
    );

-- 7. connection_codes RLS 정책
CREATE POLICY "Students can view their own codes"
    ON public.connection_codes FOR SELECT
    USING (auth.uid() = issuer_user_id);

CREATE POLICY "Anyone can view pending codes for connection"
    ON public.connection_codes FOR SELECT
    USING (status = 'pending' AND expires_at > now());

CREATE POLICY "Students can create codes"
    ON public.connection_codes FOR INSERT
    WITH CHECK (auth.uid() = issuer_user_id);

CREATE POLICY "Students can delete their codes"
    ON public.connection_codes FOR DELETE
    USING (auth.uid() = issuer_user_id);

CREATE POLICY "Parents can update codes to use them"
    ON public.connection_codes FOR UPDATE
    USING (status = 'pending' AND expires_at > now())
    WITH CHECK (used_by_parent_id = auth.uid() AND status = 'used');

-- 8. 코드 생성 함수 (6자리)
CREATE OR REPLACE FUNCTION public.generate_student_connection_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- 9. 기존 데이터 마이그레이션 (children -> student_profiles)
INSERT INTO public.student_profiles (id, user_id, name, grade, created_at, updated_at)
SELECT 
    id,
    NULL,  -- 가상 프로필로 마이그레이션 (user_id 없음)
    name,
    grade,
    created_at,
    updated_at
FROM public.children;

-- 10. 기존 데이터 마이그레이션 (children의 parent_id -> parent_child_relations)
INSERT INTO public.parent_child_relations (parent_user_id, student_profile_id, is_primary, created_at)
SELECT 
    parent_id,
    id,
    true,  -- 기존 자녀는 대표로 설정
    created_at
FROM public.children;

-- 11. 연결된 학생 계정 마이그레이션 (child_connections에서 approved된 것)
UPDATE public.student_profiles sp
SET user_id = cc.student_user_id
FROM public.child_connections cc
WHERE cc.child_id = sp.id
AND cc.status = 'approved'
AND cc.student_user_id IS NOT NULL;

-- 12. 인덱스 생성
CREATE INDEX idx_student_profiles_user_id ON public.student_profiles(user_id);
CREATE INDEX idx_parent_child_relations_parent ON public.parent_child_relations(parent_user_id);
CREATE INDEX idx_parent_child_relations_student ON public.parent_child_relations(student_profile_id);
CREATE INDEX idx_connection_codes_code ON public.connection_codes(code);
CREATE INDEX idx_connection_codes_issuer ON public.connection_codes(issuer_user_id);

-- 13. updated_at 트리거
CREATE TRIGGER update_student_profiles_updated_at
    BEFORE UPDATE ON public.student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_codes;