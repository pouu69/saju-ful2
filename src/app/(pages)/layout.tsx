import Link from 'next/link';

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080600] text-[#D4A020] overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <nav className="mb-10 flex gap-4 text-sm text-[#8A6618]">
          <Link href="/" className="hover:text-[#FFD060] transition-colors">← 처음으로 돌아가기</Link>
          <span>|</span>
          <Link href="/privacy" className="hover:text-[#FFD060] transition-colors">개인정보처리방침</Link>
          <Link href="/terms" className="hover:text-[#FFD060] transition-colors">이용약관</Link>
          <Link href="/about" className="hover:text-[#FFD060] transition-colors">소개</Link>
        </nav>
        <article className="leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#FFD060] [&_h1]:mb-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#FFD060] [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-4 [&_p]:text-[#B8960B] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1 [&_li]:text-[#B8960B]">
          {children}
        </article>
        <footer className="mt-16 pt-6 border-t border-[#2a1e08] text-xs text-[#8A6618]">
          <p>© {new Date().getFullYear()} 사주명리의 미궁. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
