export default function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-[#0F4C81] mt-8 mb-3 pb-1.5 border-b-2 border-[#E5E9F0]">
      {children}
    </h2>
  );
}
