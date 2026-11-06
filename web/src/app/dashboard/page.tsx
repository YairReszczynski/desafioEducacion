import { DashboardRadar } from "@/components/dashboard/radar";
import { getStudents } from "@/lib/students";

export default function DashboardPage() {
  const students = getStudents();
  return (
    <main>
      <DashboardRadar students={students} />
    </main>
  );
}
