import { ThemeProvider } from "@components/theme-provider";
import { ModeToggle } from "@components/mode-toggle";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="wb3sptsbt">
      <h1 className="text-3xl font-bold underline">
        Hello world!
      </h1>
      <ModeToggle />
    </ThemeProvider>
  )
}

export default App
