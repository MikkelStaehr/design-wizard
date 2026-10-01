import { WizardShell } from "@/components/wizard/WizardShell";

// Slice 2 builds step 3 (visual system); steps 1, 2, 4 and 5 arrive in slice 3.
export default function Page() {
  return <WizardShell current="visual" />;
}
