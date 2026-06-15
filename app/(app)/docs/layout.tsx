import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '云文档管理',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
