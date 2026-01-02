export const SummaryRenderer = ({ data }: { data: any }) => {
  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="font-serif text-xl font-bold">Summary</h3>

      {data.paragraphs.flatMap((p: any, i: number) => (
        <p
          key={i}
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: p.sentences.map((s: any) => s.text).join("\n\n"),
          }}
        />
      ))}
    </div>
  );
};
