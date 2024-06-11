// import { ModeToggle } from "@components/mode-toggle";
import { ConnectButton } from "./ui/connect-button"; "@components/ui/connect-button";

interface NavbarProps {}

export function Navbar({ }: NavbarProps) {
  return (
    <header className="bg-gray-900 p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo Section */}
        <div className="text-white text-xl font-bold">
          <a href="#">EURO 2024 Betting</a>
        </div>
        
        {/* Connect Button */}
        <ConnectButton />
      </div>
    </header>
  );
}