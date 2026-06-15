import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '多维表格',
};

export default function BitableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
