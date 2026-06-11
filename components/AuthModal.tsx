'use client';
 
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, User, Lock, Loader2, RefreshCw } from 'lucide-react';
 
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}
 
export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 보안문자 (CAPTCHA) 상태
  interface CaptchaChar {
    char: string;
    offsetX: number;     // X offset (e.g. -4px to 4px)
    offsetY: number;     // Y offset (e.g. -6px to 6px)
    rotate: number;      // rotation angle (e.g. -20deg to 20deg)
    fontSize: number;    // font size (e.g. 20px to 25px)
    marginRight: number; // space to next character (e.g. 14px to 24px)
  }

  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaDetails, setCaptchaDetails] = useState<CaptchaChar[]>([]);
  const [captchaInput, setCaptchaInput] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
 
  const supabase = createClient();

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 오인 방지 문자 제외(I, O, 0, 1)
    let code = '';
    const details: CaptchaChar[] = [];
    for (let i = 0; i < 5; i++) {
      const char = chars.charAt(Math.floor(Math.random() * chars.length));
      code += char;
      details.push({
        char,
        offsetX: Math.floor(Math.random() * 8) - 4,
        offsetY: Math.floor(Math.random() * 12) - 6,
        rotate: Math.floor(Math.random() * 40) - 20,
        fontSize: Math.floor(Math.random() * 6) + 20,
        marginRight: Math.floor(Math.random() * 11) + 14, // 14px to 24px
      });
    }
    setCaptchaCode(code);
    setCaptchaDetails(details);
    setCaptchaInput('');
  }, []);
 
  // 모달이 열리거나 모드가 변경될 때 보안문자 리셋
  useEffect(() => {
    if (isOpen && !isLoginMode) {
      generateCaptcha();
    }
  }, [isOpen, isLoginMode, generateCaptcha]);
 
  if (!isOpen) return null;
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
 
    if (!username || !password) {
      setErrorMsg('아이디와 비밀번호를 모두 입력해주세요.');
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setErrorMsg('아이디는 최소 3자 이상 입력해주세요.');
      setIsLoading(false);
      return;
    }

    // 아이디는 영문(a-z, A-Z), 숫자(0-9), 언더스코어(_)만 허용
    const idPattern = /^[a-zA-Z0-9_]+$/;
    if (!idPattern.test(username.trim())) {
      setErrorMsg('아이디는 영문자, 숫자, 언더스코어(_)만 사용할 수 있습니다.');
      setIsLoading(false);
      return;
    }

    // 아이디를 Supabase 이메일 형식으로 내부 변환 (example.com 사용하여 이메일 유효성 문제 회피)
    const email = `${username.trim().toLowerCase()}@example.com`;
 
    try {
      if (isLoginMode) {
        // 로그인 로직
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
 
        if (error) {
          setErrorMsg('아이디 또는 비밀번호가 올바르지 않습니다.');
        } else {
          onClose();
        }
      } else {
        // 회원가입 로직
        if (password !== confirmPassword) {
          setErrorMsg('비밀번호 확인이 일치하지 않습니다.');
          generateCaptcha();
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('비밀번호는 최소 6자 이상이어야 합니다.');
          generateCaptcha();
          setIsLoading(false);
          return;
        }

        if (captchaInput.toUpperCase() !== captchaCode) {
          setErrorMsg('보안문자가 일치하지 않습니다. 새 보안문자를 확인 후 다시 입력해주세요.');
          generateCaptcha();
          setIsLoading(false);
          return;
        }
 
        // 서버 API를 통해 회원가입 (service_role 키 사용, 이메일 확인 우회)
        const signupRes = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim().toLowerCase(),
            password,
            captcha: captchaInput.toUpperCase(),
          }),
        });

        const signupData = await signupRes.json();

        if (!signupRes.ok || !signupData.success) {
          setErrorMsg(signupData.error || '회원가입 중 오류가 발생했습니다.');
          generateCaptcha();
        } else {
          // 회원가입 성공 후 바로 로그인 처리
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            setSuccessMsg('회원가입이 완료되었습니다! 로그인 화면으로 전환합니다.');
            setTimeout(() => {
              setIsLoginMode(true);
              setConfirmPassword('');
              setCaptchaInput('');
              setErrorMsg('');
              setSuccessMsg('');
            }, 2000);
          } else {
            setSuccessMsg('회원가입 및 로그인이 완료되었습니다!');
            setTimeout(() => {
              onClose();
            }, 1500);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || '예기치 못한 에러가 발생했습니다.');
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {isLoginMode ? '수강 바구니 로그인' : '새 계정 만들기'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
 
        {/* 폼 */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
                {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100 font-medium">
                {successMsg}
              </div>
            )}
 
            {/* 아이디 입력 */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">아이디</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-gray-900"
                  placeholder="아이디를 입력하세요"
                />
              </div>
            </div>
 
            {/* 비밀번호 입력 */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">비밀번호</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-gray-900"
                  placeholder="비밀번호(최소 6자 이상)"
                />
              </div>
            </div>

            {/* 비밀번호 확인 입력 (회원가입 모드일 때만) */}
            {!isLoginMode && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <label className="text-sm font-bold text-gray-700">비밀번호 확인</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm text-gray-900"
                    placeholder="비밀번호 재입력"
                  />
                </div>
              </div>
            )}

            {/* 보안문자 영역 (회원가입 모드일 때만) */}
            {!isLoginMode && (
              <div className="space-y-2 pt-2 border-t border-gray-100 animate-in fade-in duration-200">
                <label className="text-sm font-bold text-gray-700">보안문자 입력</label>
                
                <div className="flex gap-2.5 items-center">
                  {/* 보안문자 캔버스 스타일 박스 */}
                  <div 
                    className="flex-1 bg-purple-50 border border-purple-200 rounded-xl py-2 px-4 text-center select-none text-purple-700 relative overflow-hidden flex items-center justify-center min-h-[52px]"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #ddd 10%, transparent 11%)',
                      backgroundSize: '8px 8px'
                    }}
                  >
                    {/* 데코용 선 (보안 문자 노이즈선 재현) */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-purple-300/50 -translate-y-1/2 rotate-3"></div>
                    <div className="absolute inset-x-0 top-1/3 h-0.5 bg-purple-300/50 -translate-y-1/2 -rotate-6"></div>
                    <div className="absolute inset-y-0 left-1/3 w-0.5 bg-purple-300/30 rotate-12"></div>
                    <div className="absolute inset-y-0 right-1/3 w-0.5 bg-purple-300/30 -rotate-12"></div>
                    
                    <div className="relative z-10 flex items-center justify-center">
                      {captchaDetails.map((detail, idx) => (
                        <span
                          key={idx}
                          className="inline-block font-mono font-extrabold italic select-none"
                          style={{
                            transform: `translate(${detail.offsetX}px, ${detail.offsetY}px) rotate(${detail.rotate}deg)`,
                            fontSize: `${detail.fontSize}px`,
                            marginRight: idx < 4 ? `${detail.marginRight}px` : '0px',
                            textShadow: '2px 2px 3px rgba(139, 92, 246, 0.35)'
                          }}
                        >
                          {detail.char}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* 보안문자 새로고침 버튼 */}
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors hover:text-purple-600 hover:bg-purple-50 focus:outline-none"
                    title="보안문자 새로고침"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-center uppercase tracking-wider font-mono font-bold text-sm"
                  placeholder="위 보안문자 5자리 입력"
                  maxLength={5}
                />
              </div>
            )}
 
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoginMode ? '로그인' : '회원가입 완료'}
            </button>
          </form>
        </div>
 
        {/* 푸터 (모드 전환) */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            {isLoginMode ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button 
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setErrorMsg('');
                setSuccessMsg('');
                setPassword('');
                setConfirmPassword('');
                setCaptchaInput('');
              }}
              className="ml-2 text-purple-600 font-bold hover:underline"
            >
              {isLoginMode ? '회원가입' : '로그인하기'}
            </button>
          </p>
        </div>
 
      </div>
    </div>
  );
}
