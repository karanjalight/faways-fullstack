import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 font-sans bg-background">
      <div className="flex flex-col gap-6 p-6 md:p-10 lg:px-16">
        <div className="flex flex-1 items-center justify-center ">
          <div className="w-full max-w-xl">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/50 z-10" />
        <img
          src="https://images.pexels.com/photos/756083/pexels-photo-756083.jpeg"
          alt="Elegant workspace with laptop and coffee"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

