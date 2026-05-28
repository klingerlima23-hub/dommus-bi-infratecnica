export default function LoadingState({ message = 'Carregando dados...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-14 h-14 border-4 border-[#0F4C81]/20 border-t-[#0F4C81] rounded-full animate-spin mb-4" />
      <p className="text-sm text-[#5A6677] font-medium">{message}</p>
    </div>
  );
}
