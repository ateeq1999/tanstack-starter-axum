import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_public")({
  component: () => (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Outlet />
    </main>
  ),
})
