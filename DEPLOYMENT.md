## 필수 환경 변수

프로젝트를 배포하기 전에 다음 환경 변수들을 설정해야 합니다:

- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase 공개 키 (anon/public key)

---

## 새 Supabase 프로젝트에 Edge Functions 배포 (단계별)

본인 소유의 **새 Supabase 프로젝트**에 이 레포의 Edge Functions를 배포하는 전체 절차입니다.

### 사전 준비

1. **Supabase 프로젝트**
   - [Supabase Dashboard](https://app.supabase.com)에서 새 프로젝트를 만들었거나, 연결할 기존 프로젝트가 있어야 합니다.
   - 프로젝트 URL 형식: `https://<project-ref>.supabase.co`  
     **Project REF**는 이 URL의 `<project-ref>` 부분입니다 (예: `abcdefghijklmnop`).

2. **Firebase (휴대폰 인증용)**
   - 이 앱이 Firebase 휴대폰 인증 후 Supabase 사용자를 만드는 구조이므로, **Firebase 프로젝트**와 **웹 API 키**가 이미 있어야 합니다.
   - Firebase Console → 프로젝트 설정 → 일반 → **웹 API 키**를 복사해 둡니다. (나중에 `FIREBASE_API_KEY` 시크릿으로 넣습니다.)

3. **Supabase DB 스키마**
   - 새 프로젝트에 `profiles`, `user_roles` 등 앱에서 사용하는 테이블이 있어야 Edge Function이 정상 동작합니다. 마이그레이션이나 수동 생성이 선행되어야 합니다.

---

### 1단계: Supabase CLI 설치

**macOS (Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Windows (Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**npm으로 전역 설치:**
```bash
npm install -g supabase
```

설치 확인:
```bash
supabase --version
```

공식 문서: [Supabase CLI](https://supabase.com/docs/guides/cli)

---

### 2단계: 로그인 및 새 프로젝트 연결

1. **CLI 로그인** (브라우저가 열리며 Supabase 계정으로 로그인):
   ```bash
   supabase login
   ```

2. **프로젝트 루트에서 새 프로젝트에 연결**  
   `<project-ref>`를 새 Supabase 프로젝트의 REF로 바꿉니다.
   ```bash
   cd /path/to/eduflo-demo
   supabase link --project-ref <project-ref>
   ```
   - 예: URL이 `https://xyzabc123.supabase.co`이면 `supabase link --project-ref xyzabc123`
   - 연결 시 비밀번호를 물으면, Supabase 대시보드 → Project Settings → Database → **Database password** 값을 입력합니다.

3. **(선택) config.toml에 project_id 고정**  
   같은 프로젝트만 쓸 거라면 `supabase/config.toml` 첫 줄을 새 프로젝트 REF로 맞춥니다.
   ```toml
   project_id = "새프로젝트REF"
   ```

---

### 3단계: 배포할 Edge Function 확인

이 레포에 있는 Edge Functions:

| 함수명 | 용도 | 필수 시크릿 |
|--------|------|-------------|
| `firebase-signup` | Firebase 휴대폰 인증 후 Supabase 회원가입 | `FIREBASE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `firebase-login` | Firebase 휴대폰 인증 후 Supabase 로그인(세션 발급) | 동일 |
| `auth-phone-verify` | (설정 시) 휴대폰 인증 검증 | config.toml 참고 |
| `login-with-phone` | (사용 시) 휴대폰 로그인 | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `send-verification-email` | (사용 시) 이메일 인증 발송 | `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `update-auth-settings` | (사용 시) Auth 설정 변경 | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` 등 |

**휴대폰 로그인/회원가입만 쓰는 경우**에는 `firebase-signup`과 `firebase-login`만 배포하면 됩니다.

---

### 4단계: Edge Function 배포

프로젝트 루트(`eduflo-demo`)에서 실행합니다.

**Firebase 연동 두 개만 배포:**
```bash
supabase functions deploy firebase-signup
supabase functions deploy firebase-login
```

**한 번에 여러 개 배포:**
```bash
supabase functions deploy firebase-signup
supabase functions deploy firebase-login
# 필요 시 추가
# supabase functions deploy login-with-phone
# supabase functions deploy send-verification-email
```

배포가 성공하면 터미널에 함수 URL이 출력됩니다.  
호출 주소 형식: `https://<project-ref>.supabase.co/functions/v1/<함수명>`

---

### 5단계: Secret 설정 (필수)

Edge Function은 **Supabase 대시보드**에서만 설정하는 Secret(환경 변수)을 사용합니다. 로컬 `.env`와는 별도입니다.

1. [Supabase Dashboard](https://app.supabase.com) → **새로 연결한 프로젝트** 선택  
2. 왼쪽 하단 **Project Settings** (톱니바퀴) 클릭  
3. **Edge Functions** 메뉴 선택  
4. **Secrets** 탭에서 아래 변수 추가

**firebase-signup / firebase-login 공통:**

| Name | 설명 | 어디서 복사 |
|------|------|-------------|
| `FIREBASE_API_KEY` | Firebase 웹 API 키 | Firebase Console → 프로젝트 설정 → 일반 → 웹 API 키 (프론트엔드 `VITE_FIREBASE_API_KEY`와 동일한 값) |
| `SUPABASE_URL` | Supabase 프로젝트 URL | Project Settings → API → **Project URL** (예: `https://xxxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 롤 키 (비공개) | Project Settings → API → **Project API keys** → `service_role` (secret) **절대 클라이언트/프론트엔드에 노출 금지** |

- **Add new secret** 버튼으로 이름과 값을 하나씩 입력한 뒤 저장합니다.
- 시크릿을 바꾼 뒤에는 **Edge Function을 다시 배포할 필요는 없고**, 다음 호출부터 새 값이 적용됩니다 (일부 플랫폼은 재배포 필요할 수 있음).

---

### 6단계: 배포 확인

1. **대시보드에서 확인**  
   Supabase Dashboard → **Edge Functions** 메뉴에서 `firebase-signup`, `firebase-login`이 목록에 있고 상태가 정상인지 봅니다.

2. **curl로 동작 테스트 (선택)**  
   - `firebase-login`은 `idToken`이 필요하므로, 실제로는 앱에서 휴대폰 인증 후 호출해 보는 것이 좋습니다.
   - 브라우저 또는 앱에서 로그인/회원가입 플로우를 한 번 진행해 보며, 네트워크 탭에서 `https://<project-ref>.supabase.co/functions/v1/firebase-signup` 또는 `firebase-login` 요청이 200으로 성공하는지 확인합니다.

3. **앱 환경 변수**  
   앱(.env 또는 배포 플랫폼 환경 변수)에 **새 프로젝트** 기준으로 설정했는지 확인합니다.
   - `VITE_SUPABASE_URL=https://<project-ref>.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=<새 프로젝트의 anon key>`

이렇게 하면 앱이 새 Supabase 프로젝트와 그 프로젝트에 배포한 Edge Functions를 사용하게 됩니다.

---

## Supabase 리디렉션 URL 설정

**중요**: 도메인을 변경한 후에는 Supabase 대시보드에서 리디렉션 URL을 업데이트해야 합니다.

1. **Supabase 대시보드 접속**
   - [Supabase Dashboard](https://app.supabase.com)에 로그인
   - 프로젝트 선택

2. **Authentication 설정 업데이트**
   - Authentication > URL Configuration으로 이동
   - **Site URL**: 새 도메인 (예: `https://yourdomain.com`)
   - **Redirect URLs**에 다음 추가:
     - `https://yourdomain.com/auth`
     - `https://yourdomain.com/**` (와일드카드)
     - 개발 환경을 유지하려면: `http://localhost:8080/auth`

3. **이메일 템플릿 확인**
   - Authentication > Email Templates
   - 리디렉션 URL이 새 도메인을 사용하도록 확인

## 로컬 테스트

배포 전 로컬에서 빌드 테스트:

```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 문제 해결

### CORS 오류
- Supabase에서 새 도메인을 허용된 오리진에 추가했는지 확인

### 환경 변수 오류
- 환경 변수 이름이 `VITE_`로 시작하는지 확인
- 빌드 후 환경 변수가 제대로 포함되었는지 확인:
  - `dist/index.html` 또는 빌드된 JavaScript 파일 확인

### 라우팅 오류 (404)
- SPA(Single Page Application)이므로 모든 경로를 `index.html`로 리다이렉트해야 함
- Vercel: `vercel.json`의 `rewrites` 설정 확인
- Netlify: `netlify.toml`의 `redirects` 설정 확인

## 추가 확인사항

1. **빌드 성공 여부**: 배포 플랫폼의 빌드 로그 확인
2. **환경 변수**: 프로덕션 환경에서 환경 변수가 제대로 로드되는지 확인
3. **Supabase 연결**: 브라우저 콘솔에서 Supabase 연결 오류 확인
4. **인증 플로우**: 로그인/회원가입이 새 도메인에서 정상 작동하는지 테스트

## 보안 고려사항

- 환경 변수에 민감한 정보가 포함되지 않도록 주의 (프론트엔드 환경 변수는 빌드에 포함됨)
- Supabase 서비스 롤 키는 절대 프론트엔드 코드에 포함하지 말 것
- HTTPS 사용 (대부분의 배포 플랫폼에서 자동 제공)