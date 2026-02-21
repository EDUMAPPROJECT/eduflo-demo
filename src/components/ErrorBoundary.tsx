import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const msg = this.state.error.message;
      const isEnvMissing =
        msg.includes("SUPABASE") ||
        msg.includes("VITE_") ||
        msg.includes("environment");

      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/30"
          role="alert"
        >
          <div className="max-w-md w-full rounded-xl border bg-card p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-destructive mb-2">
              페이지를 불러올 수 없습니다
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {isEnvMissing ? (
                <>
                  배포 환경 변수가 설정되지 않았을 수 있습니다. Vercel이면 프로젝트
                  설정 → Environment Variables에 <code className="bg-muted px-1 rounded">VITE_SUPABASE_URL</code>,{" "}
                  <code className="bg-muted px-1 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code> 등을
                  추가한 뒤 재배포해 주세요.
                </>
              ) : (
                <>오류: {this.state.error.message}</>
              )}
            </p>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
