import Image from "next/image";
import AppSettings from "@/components/appSettings/AppSettings";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUserName } from "@/features/userSlice";
import { clearAuthToken } from "@/services/authService";

const Header = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = () => {
    clearAuthToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("userName");
      localStorage.removeItem("lastActive");
    }
    dispatch(setUserName("User"));
    router.push("/");
  };

  return (
    <div className="relative">
      <div className="fixed left-5 top-7 transform -translate-y-1/2 z-11 backdrop-blur bg-background/80">
        <button
          type="button"
          title="Logout"
          onClick={handleLogout}
          className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <Image
            src="/logo.svg"
            alt="RayWit logo"
            width={32}
            height={32}
            sizes="(max-width: 640px) 24px, (max-width: 1024px) 28px, 32px"
            className="h-6 w-6 sm:h-8 sm:w-8"
          />
        </button>
      </div>
      <div
        title="App Settings"
        className="fixed right-5 top-7 transform -translate-y-1/2 z-11 backdrop-blur bg-background/80"
      >
        <AppSettings></AppSettings>
      </div>
    </div>
  );
};

export default Header;
