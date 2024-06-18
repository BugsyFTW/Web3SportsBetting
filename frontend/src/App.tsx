import { ThemeProvider } from "@components/theme-provider";
import { initWeb3Modal } from "@/lib/web3modal";

import { Navbar } from "@components/navbar";
import { GameList } from "@components/game-list";

// Initialize the Web3Modal instance
initWeb3Modal();

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="wb3sptsbt">
      <Navbar />
      <div className="flex flex-col items-center gap-16 m-16">
        <GameList />
      </div>
    </ThemeProvider>
  );
}

export default App;
