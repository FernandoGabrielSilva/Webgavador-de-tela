import dynamic from "next/dynamic";
// Carrega o componente que usa `canvas` apenas no cliente
const ScreenRecorder = dynamic(() => import("./_components/ScreenRecorder"), {
  ssr: false, // Desabilita a renderização no servidor
});

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <ScreenRecorder />
    </main>
  );
}
