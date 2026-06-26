import './globals.css';import type { Metadata } from 'next';import { Nav } from '@/components/nav';
export const metadata:Metadata={title:process.env.NEXT_PUBLIC_APP_NAME||'Quiniela Mundial 2026',description:'Quiniela del Mundial 2026'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body><Nav/><main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main></body></html>}
