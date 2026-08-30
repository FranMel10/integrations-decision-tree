import { DecisionTree } from "@/components/DecisionTree";

export default function HomePage() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Support Contact Flow — Integrations</h1>
        <p>Click the option that matches the case to move through the tree.</p>
      </header>
      <DecisionTree />
    </main>
  );
}
