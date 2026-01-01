export const FlowchartRenderer = ({ data }: { data: any }) => {
  return (
    <div className="glass-card p-6">
      <h3 className="font-serif text-xl font-bold mb-4">Flowchart</h3>

      <ol className="space-y-3">
        {data.steps.map((step: any, i: number) => (
          <li
            key={i}
            className="p-3 border rounded-lg bg-muted"
          >
            <strong>Step {i + 1}:</strong> {step.text}
          </li>
        ))}
      </ol>
    </div>
  );
};
