import { WizardShell } from "@/components/wizard/WizardShell";

// Slice 3a: steps 1 (profile) and 3 (visual system) are built; step 2 is a placeholder stop.
// A new project opens on its first open stop (WizardShell).
export default function Page() {
  return <WizardShell />;
}
