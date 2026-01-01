export const VisualRenderer = ({ data }: { data: any }) => {
  return (
    <div className="glass-card p-6">
      <h3 className="font-serif text-xl font-bold">Visual Output</h3>
      <pre className="text-xs mt-4 bg-muted p-4 rounded">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};
