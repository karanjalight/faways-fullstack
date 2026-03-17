import { GalleryVerticalEnd } from "lucide-react";

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh font-sans lg:grid-cols-2 bg-background">
      {/* Left: premium form */}
      <div className="flex  flex-col gap-6 p-6 md:p-10 lg:px-16">
        
        <div className="flex flex-1 lg: items-center justify-center  ">
          <div className="w-full max-w-xl lg:ml-4">
            
            <LoginForm />
          </div>
        </div>
      </div>
      {/* Right: hero image from Pexels */}
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

