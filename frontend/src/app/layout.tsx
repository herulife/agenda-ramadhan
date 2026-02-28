import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Ramadhan Ceria - Keluarga Bahagia',
  description: 'Aplikasi manajemen puasa dan ibadah Ramadhan untuk anak',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster 
            position="top-center" 
            expand={true}
            richColors
            closeButton
            duration={4000}
            toastOptions={{
              style: {
                fontFamily: "'Quicksand', sans-serif",
                borderRadius: '16px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 10px 40px rgba(201, 139, 46, 0.15), 0 4px 12px rgba(0,0,0,0.05)',
              },
              classNames: {
                success: 'sonner-success-ramadhan',
                error: 'sonner-error-ramadhan',
                info: 'sonner-info-ramadhan',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
