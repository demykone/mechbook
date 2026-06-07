import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export function DashboardPage() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: "/" });
  }, [navigate]);
  return null;
}

export default DashboardPage;
