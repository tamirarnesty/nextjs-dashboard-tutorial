import AcmeLogo from '@/app/ui/acme-logo';
import LoginForm from '@/app/ui/login-form';

export default function LoginPage() {
  return (
    // For main, we use flex to center the content vertically and horizontally
    // items-center and justify-center are flexbox utility classes
    // NOTE: Reference https://css-tricks.com/snippets/css/a-guide-to-flexbox/#aa-flexbox-properties
    <main className="flex items-center justify-center md:h-screen bg-orange-500">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32 bg-red-500">
        <div className="flex h-20 w-full items-end rounded-lg bg-green-500 p-3 md:h-36">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
